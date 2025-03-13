const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'hr_db',
  password: 'admin', // Asegúrate de añadir tu contraseña si es necesario
  port: 5432,
});

// Test de conexión
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`Conexión exitosa: ${result.rows[0].now}`);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

// Clave secreta para JWT (cámbiala por una más segura en producción)
const JWT_SECRET = 'tu_clave_secreta_very_secure';

// Middleware para verificar token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// [Paso 2.1] Middleware para autorizar roles
// Este middleware verifica si el usuario tiene el rol especificado en su lista de roles
const authorizeRole = (role) => (req, res, next) => {
  if (!req.user.roles || !req.user.roles.includes(role)) {
    return res.status(403).json({ error: 'Acceso denegado: No tienes permisos suficientes' });
  }
  next();
};

// [Paso 2.2] Endpoint de login actualizado
// - Obtiene los roles del usuario desde user_roles
// - Verifica force_password_change y devuelve un error 403 si es TRUE
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Credenciales no válidas' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Credenciales no válidas' });
    }

    // Obtener los roles del usuario desde user_roles
    const rolesResult = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [user.id]);
    const roles = rolesResult.rows.map(row => row.role);

    // Verificar si el usuario debe cambiar su contraseña
    if (user.force_password_change) {
      return res.status(403).json({ success: false, message: 'Debes cambiar tu contraseña', userId: user.id });
    }

    // Generar token con los roles
    const token = jwt.sign(
      { id: user.id, email: user.email, roles: roles.length > 0 ? roles : ['employee'] },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ success: true, token });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// [Paso 2.3] Endpoint para cambiar contraseña actualizado
// - Actualiza force_password_change a FALSE tras el cambio exitoso
app.put('/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const user = result.rows[0];
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Contraseña antigua incorrecta' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1, force_password_change = FALSE WHERE id = $2',
      [hashedPassword, userId]
    );
    res.json({ message: 'Contraseña actualizada con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Empleados ---

// [Paso 2.4] Restringir acceso a inactivos solo para admins
app.get('/employees/inactive', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { department_id, hire_date_start, hire_date_end, salary_min, salary_max } = req.query;
    let query = 'SELECT e.*, r.salary FROM employees e JOIN roles r ON e.role_id = r.id WHERE e.is_active = FALSE';
    const values = [];

    if (department_id) {
      query += ` AND e.department_id = $${values.length + 1}`;
      values.push(department_id);
    }
    if (hire_date_start) {
      query += ` AND e.hire_date >= $${values.length + 1}`;
      values.push(hire_date_start);
    }
    if (hire_date_end) {
      query += ` AND e.hire_date <= $${values.length + 1}`;
      values.push(hire_date_end);
    }
    if (salary_min) {
      query += ` AND r.salary >= $${values.length + 1}`;
      values.push(salary_min);
    }
    if (salary_max) {
      query += ` AND r.salary <= $${values.length + 1}`;
      values.push(salary_max);
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inactive employees:', error);
    res.status(500).json({ error: error.message });
  }
});

// [Paso 2.5] Filtrar empleados según el rol del usuario
// - Admins ven todos los empleados
// - Empleados solo ven sus propios datos
app.get('/employees', authenticateToken, async (req, res) => {
  try {
    const { department_id, hire_date_start, hire_date_end, salary_min, salary_max } = req.query;
    let query = 'SELECT e.*, r.salary FROM employees e JOIN roles r ON e.role_id = r.id WHERE e.is_active = TRUE';
    const values = [];

    if (req.query.inactive === 'true') {
      // Solo admins pueden ver inactivos
      if (!req.user.roles.includes('admin')) {
        return res.status(403).json({ error: 'Acceso denegado: Solo admins pueden ver empleados inactivos' });
      }
      query = 'SELECT e.*, r.salary FROM employees e JOIN roles r ON e.role_id = r.id WHERE e.is_active = FALSE';
    } else if (!req.user.roles.includes('admin')) {
      // Empleados solo ven sus propios datos
      query = 'SELECT e.*, r.salary FROM employees e JOIN roles r ON e.role_id = r.id WHERE e.id = $1 AND e.is_active = TRUE';
      values.push(req.user.id);
    }

    if (department_id) {
      query += ` AND e.department_id = $${values.length + 1}`;
      values.push(department_id);
    }
    if (hire_date_start) {
      query += ` AND e.hire_date >= $${values.length + 1}`;
      values.push(hire_date_start);
    }
    if (hire_date_end) {
      query += ` AND e.hire_date <= $${values.length + 1}`;
      values.push(hire_date_end);
    }
    if (salary_min) {
      query += ` AND r.salary >= $${values.length + 1}`;
      values.push(salary_min);
    }
    if (salary_max) {
      query += ` AND r.salary <= $${values.length + 1}`;
      values.push(salary_max);
    }

    query += ' ORDER BY e.id ASC';
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: error.message });
  }
});

// [Paso 2.6] Restringir acceso a detalles de empleados
// - Empleados solo ven su propio perfil
app.get('/employees/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    if (!req.user.roles.includes('admin') && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Acceso denegado: Solo puedes ver tu propio perfil o necesitas permisos de admin' });
    }
    const result = await pool.query('SELECT * FROM employees WHERE id = $1 AND is_active = TRUE', [id]);
    if (result.rows.length === 0) return res.status(404).send('Empleado no encontrado');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

// [Paso 2.7] Restringir acceso a dashboard solo para admins
app.get('/dashboard', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const activeEmployees = await pool.query('SELECT COUNT(*) FROM employees WHERE is_active = TRUE');
    const inactiveEmployees = await pool.query('SELECT COUNT(*) FROM employees WHERE is_active = FALSE');
    const totalSalary = await pool.query('SELECT SUM(r.salary) FROM employees e JOIN roles r ON e.role_id = r.id WHERE e.is_active = TRUE');
    const deptCount = await pool.query('SELECT COUNT(*) FROM departments');

    res.json({
      activeEmployees: parseInt(activeEmployees.rows[0].count),
      inactiveEmployees: parseInt(inactiveEmployees.rows[0].count),
      totalSalary: parseFloat(totalSalary.rows[0].sum || 0),
      departmentCount: parseInt(deptCount.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: error.message });
  }
});

// [Paso 2.8] Restringir acceso a distribución de departamentos solo para admins
app.get('/dashboard/dept-distribution', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.name, COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.is_active = TRUE
      GROUP BY d.id, d.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching dept distribution:', error);
    res.status(500).json({ error: error.message });
  }
});

// [Paso 2.9] Restringir creación de empleados solo para admins
// - Simula el envío de la contraseña temporal (el trigger ya la genera)
app.post('/employees', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { first_name, last_name, email, hire_date, department_id, role_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO employees (first_name, last_name, email, hire_date, department_id, role_id, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [first_name, last_name, email, hire_date, department_id, role_id, true]
    );
    const employee = result.rows[0];
    
    // El trigger en la base de datos ya creó el usuario en users con una contraseña temporal
    // Simulamos el envío de la contraseña temporal (en producción, usa Nodemailer)
    console.log(`Usuario creado para ${email} con contraseña temporal. Revisar logs de PostgreSQL (RAISE NOTICE) para la contraseña.`);

    // [Paso 2.10] Asignar rol 'employee' al nuevo usuario
    const userResult = await pool.query('SELECT id FROM users WHERE employee_id = $1', [employee.id]);
    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      await pool.query(
        'INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, 'employee']
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

// [Paso 2.11] Restringir edición de empleados solo para admins
app.put('/employees/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, hire_date, department_id, role_id } = req.body;
  try {
    const currentEmployee = await pool.query('SELECT * FROM employees WHERE id = $1 AND is_active = TRUE', [id]);
    if (currentEmployee.rows.length === 0) {
      return res.status(404).send('Empleado no encontrado');
    }
    const oldData = currentEmployee.rows[0];

    const result = await pool.query(
      'UPDATE employees SET first_name = $1, last_name = $2, email = $3, hire_date = $4, department_id = $5, role_id = $6 WHERE id = $7 AND is_active = TRUE RETURNING *',
      [first_name, last_name, email, hire_date, department_id, role_id, id]
    );

    const fieldsToCheck = [
      { name: 'hire_date', old: oldData.hire_date, new: hire_date },
      { name: 'department_id', old: oldData.department_id, new: department_id },
      { name: 'role_id', old: oldData.role_id, new: role_id },
    ];

    for (const field of fieldsToCheck) {
      if (field.old !== field.new) {
        await pool.query(
          'INSERT INTO employee_history (employee_id, field_changed, old_value, new_value) VALUES ($1, $2, $3, $4)',
          [id, field.name, field.old.toString(), field.new.toString()]
        );
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

// [Paso 2.12] Restringir eliminación de empleados solo para admins
app.delete('/employees/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE employees SET is_active = FALSE WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error marking employee as inactive:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Departamentos ---

// [Paso 2.13] Restringir acceso a departamentos solo para admins
app.get('/departments', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.post('/departments', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO departments (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.put('/departments/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const result = await pool.query(
      'UPDATE departments SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    if (result.rows.length === 0) return res.status(404).send('Departamento no encontrado');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.delete('/departments/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const employeeCount = await pool.query('SELECT COUNT(*) FROM employees WHERE department_id = $1 AND is_active = TRUE', [id]);
    if (parseInt(employeeCount.rows[0].count) > 0) {
      return res.status(400).json({ error: `No se puede eliminar el departamento. Tiene ${employeeCount.rows[0].count} empleados asociados.` });
    }
    await pool.query('DELETE FROM departments WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

// --- Roles ---

// [Paso 2.14] Restringir acceso a roles solo para admins
app.get('/roles', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.post('/roles', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { title, salary } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO roles (title, salary) VALUES ($1, $2) RETURNING *',
      [title, salary || 0.00]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.put('/roles/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { title, salary } = req.body;
  try {
    const result = await pool.query(
      'UPDATE roles SET title = $1, salary = $2 WHERE id = $3 RETURNING *',
      [title, salary || 0.00, id]
    );
    if (result.rows.length === 0) return res.status(404).send('Cargo no encontrado');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.delete('/roles/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const employeeCount = await pool.query('SELECT COUNT(*) FROM employees WHERE role_id = $1 AND is_active = TRUE', [id]);
    if (parseInt(employeeCount.rows[0].count) > 0) {
      return res.status(400).json({ error: `No se puede eliminar el cargo. Tiene ${employeeCount.rows[0].count} empleados asociados.` });
    }
    await pool.query('DELETE FROM roles WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

// --- Reportes y Historial ---

// [Paso 2.15] Filtrar reportes según el rol del usuario
// - Empleados solo ven su departamento
app.get('/reports/salaries-by-department', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT 
        d.name AS department_name,
        COUNT(e.id) AS employee_count,
        SUM(r.salary) AS total_salary,
        AVG(r.salary) AS avg_salary
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.is_active = TRUE
      LEFT JOIN roles r ON e.role_id = r.id
    `;
    const values = [];

    if (!req.user.roles.includes('admin')) {
      // Empleados solo ven su departamento
      const userResult = await pool.query('SELECT department_id FROM employees WHERE id = $1 AND is_active = TRUE', [req.user.id]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }
      query += ` WHERE d.id = $${values.length + 1}`;
      values.push(userResult.rows[0].department_id);
    }

    query += ' GROUP BY d.id, d.name ORDER BY d.id';
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

// [Paso 2.16] Restringir historial de empleados solo para admins
app.get('/employees/:id/history', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM employee_history WHERE employee_id = $1 ORDER BY change_date DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

// [Paso 2.17] Restringir restauración de empleados solo para admins
app.put('/employees/:id/restore', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE employees SET is_active = TRUE WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error restoring employee:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Reconocimientos ---

// [Paso 2.18] Filtrar reconocimientos según el rol del usuario
// - Empleados solo ven sus reconocimientos
app.get('/recognitions', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM recognitions';
    const values = [];
    if (!req.user.roles.includes('admin')) {
      // Empleados solo ven sus reconocimientos
      query += ' WHERE employee_id = $1';
      values.push(req.user.id);
    }
    query += ' ORDER BY date DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
    values.push(limit, offset);

    const result = await pool.query(query, values);
    const total = await pool.query('SELECT COUNT(*) FROM recognitions' + (values.length > 0 ? ' WHERE employee_id = $1' : ''), values.slice(0, 1));
    res.json({
      data: result.rows,
      total: parseInt(total.rows[0].count),
      page,
      limit,
    });
  } catch (err) {
    console.error('Error fetching recognitions:', err);
    res.status(500).json({ error: 'Error fetching recognitions' });
  }
});

app.post('/recognitions', authenticateToken, async (req, res) => {
  const { employee_id, message, badge, date } = req.body;

  try {
    const employeeCheck = await pool.query('SELECT * FROM employees WHERE id = $1 AND is_active = TRUE', [employee_id]);
    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado o no está activo' });
    }

    if (!message || !badge || !date) {
      return res.status(400).json({ error: 'Faltan campos requeridos: message, badge, y date son obligatorios' });
    }

    const result = await pool.query(
      'INSERT INTO recognitions (employee_id, message, badge, date) VALUES ($1, $2, $3, $4) RETURNING *',
      [employee_id, message, badge, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating recognition:', err);
    res.status(500).json({ error: 'Error creating recognition: ' + err.message });
  }
});

// [Paso 2.19] Restringir eliminación de reconocimientos solo para admins
app.delete('/recognitions/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM recognitions WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Reconocimiento no encontrado' });
    }
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting recognition:', err);
    res.status(500).json({ error: 'Error deleting recognition: ' + err.message });
  }
});

// [Paso 2.20] Restringir registro de tiempo
// - Empleados solo pueden registrar su propio tiempo
app.post('/time/clock-in', authenticateToken, async (req, res) => {
  const { employee_id } = req.body;
  try {
    if (!req.user.roles.includes('admin') && req.user.id !== parseInt(employee_id)) {
      return res.status(403).json({ error: 'Acceso denegado: Solo puedes registrar tu propio tiempo' });
    }
    const result = await pool.query(
      'INSERT INTO time_entries (employee_id, clock_in) VALUES ($1, NOW()) RETURNING *',
      [employee_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/time/clock-out/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const entry = await pool.query('SELECT * FROM time_entries WHERE id = $1', [id]);
    if (entry.rows.length === 0) return res.status(404).json({ error: 'Entrada no encontrada' });
    if (!req.user.roles.includes('admin') && req.user.id !== parseInt(entry.rows[0].employee_id)) {
      return res.status(403).json({ error: 'Acceso denegado: Solo puedes registrar tu propio tiempo' });
    }
    const result = await pool.query(
      'UPDATE time_entries SET clock_out = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar el servidor
app.listen(3001, () => console.log('Server running on port 3001'));