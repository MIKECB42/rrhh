const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();

app.use(express.json());
app.use(cors());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'hr_db',
  password: 'admin',
  port: 5432,
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sk1permd@gmail.com',
    pass: 'owkq qauw jbxw tury',
  },
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`Conexión exitosa: ${result.rows[0].now}`);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

const JWT_SECRET = 'tu_clave_secreta_very_secure';

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

const authorizeRole = (role) => (req, res, next) => {
  if (!req.user.roles || !req.user.roles.includes(role)) {
    return res.status(403).json({ error: 'Acceso denegado: No tienes permisos suficientes' });
  }
  next();
};

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

    const rolesResult = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [user.id]);
    const roles = rolesResult.rows.map(row => row.role);

    if (user.force_password_change) {
      return res.status(403).json({ success: false, message: 'Debes cambiar tu contraseña', userId: user.id });
    }

    const token = jwt.sign(
      { user_id: user.id, employee_id: user.employee_id, email: user.email, roles: roles.length > 0 ? roles : ['employee'] },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('Token generado en /login:', { user_id: user.id, employee_id: user.employee_id, email, roles });
    res.json({ success: true, token });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/change-password', async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  try {
    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Faltan campos requeridos: email, oldPassword, newPassword' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Contraseña antigua incorrecta' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1, force_password_change = FALSE WHERE id = $2',
      [hashedPassword, user.id]
    );

    const rolesResult = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [user.id]);
    const roles = rolesResult.rows.map(row => row.role);
    const token = jwt.sign(
      { user_id: user.id, employee_id: user.employee_id, email: user.email, roles: roles.length > 0 ? roles : ['employee'] },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('Token generado en /change-password:', { user_id: user.id, employee_id: user.employee_id, email, roles });
    res.json({ message: 'Contraseña actualizada con éxito', token });
  } catch (err) {
    console.error('Error en PUT /change-password:', err);
    res.status(500).json({ error: err.message });
  }
});

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

app.get('/employees', authenticateToken, async (req, res) => {
  try {
    const { department_id, hire_date_start, hire_date_end, salary_min, salary_max } = req.query;
    let query = `
      SELECT e.*, r.salary, d.name AS department_name, r.title AS role_title
      FROM employees e
      JOIN roles r ON e.role_id = r.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.is_active = TRUE
    `;
    const values = [];

    if (req.query.inactive === 'true') {
      if (!req.user.roles.includes('admin')) {
        return res.status(403).json({ error: 'Acceso denegado: Solo admins pueden ver empleados inactivos' });
      }
      query = `
        SELECT e.*, r.salary, d.name AS department_name, r.title AS role_title
        FROM employees e
        JOIN roles r ON e.role_id = r.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.is_active = FALSE
      `;
    } else if (!req.user.roles.includes('admin')) {
      query += ' AND e.id = $1';
      values.push(req.user.employee_id);
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

app.get('/employees/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    if (!req.user.roles.includes('admin') && req.user.employee_id !== parseInt(id)) {
      return res.status(403).json({ error: 'Acceso denegado: Solo puedes ver tu propio perfil o necesitas permisos de admin' });
    }
    const result = await pool.query(`
      SELECT e.*, d.name AS department_name, r.title AS role_title, r.salary
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      JOIN roles r ON e.role_id = r.id
      WHERE e.id = $1 AND e.is_active = TRUE
    `, [id]);
    if (result.rows.length === 0) return res.status(404).send('Empleado no encontrado');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en GET /employees/:id:', err);
    res.status(500).send(`Error: ${err.message}`);
  }
});

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

app.post('/employees', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { first_name, last_name, email, hire_date, department_id, role_id } = req.body;

  try {
    console.log('Inicio de POST /employees');
    console.log('Datos recibidos:', { first_name, last_name, email, hire_date, department_id, role_id });

    if (!first_name || !last_name || !email || !hire_date) {
      console.log('Faltan campos obligatorios');
      return res.status(400).json({ error: 'Faltan campos obligatorios: first_name, last_name, email, hire_date son requeridos' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(hire_date)) {
      console.log('Formato de hire_date inválido');
      return res.status(400).json({ error: 'Formato de hire_date inválido. Use YYYY-MM-DD' });
    }

    if (department_id) {
      const deptCheck = await pool.query('SELECT id FROM departments WHERE id = $1', [department_id]);
      if (deptCheck.rows.length === 0) {
        console.log(`department_id ${department_id} no existe`);
        return res.status(400).json({ error: `El department_id ${department_id} no existe` });
      }
    }

    if (role_id) {
      const roleCheck = await pool.query('SELECT id FROM roles WHERE id = $1', [role_id]);
      if (roleCheck.rows.length === 0) {
        console.log(`role_id ${role_id} no existe`);
        return res.status(400).json({ error: `El role_id ${role_id} no existe` });
      }
    }

    const tempPassword = `TempPass${Math.floor(Math.random() * 1000000)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    console.log('Insertando empleado en employees...');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const employeeResult = await client.query(
        'INSERT INTO employees (first_name, last_name, email, hire_date, department_id, role_id, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [first_name, last_name, email, hire_date, department_id, role_id, true]
      );
      const employee = employeeResult.rows[0];
      console.log('Empleado creado:', employee);

      const userResult = await client.query(
        'INSERT INTO users (employee_id, email, password, role, is_active, created_at, force_password_change) VALUES ($1, $2, $3, $4, $5, NOW(), TRUE) RETURNING id',
        [employee.id, email, hashedPassword, 'employee', true]
      );
      const userId = userResult.rows[0].id;
      console.log('Usuario creado con ID:', userId);

      await client.query(
        'INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT (user_id, role) DO NOTHING',
        [userId, 'employee']
      );
      console.log('Rol employee asignado al usuario');

      const mailOptions = {
        from: 'tu_correo@gmail.com',
        to: email,
        subject: 'Bienvenido(a) a HR System - Contraseña Temporal',
        text: `Hola ${first_name} ${last_name},\n\nTu cuenta ha sido creada en el sistema HR. Aquí está tu contraseña temporal para iniciar sesión:\n\nContraseña: ${tempPassword}\n\nPor favor, inicia sesión en http://localhost:3000 y cambia tu contraseña lo antes posible.\n\nSaludos,\nEquipo HR`,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Correo enviado a ${email} con contraseña temporal: ${tempPassword}`);

      await client.query('COMMIT');

      res.status(201).json({ ...employee, tempPassword });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error en POST /employees:', {
      message: err.message,
      stack: err.stack,
      requestBody: req.body
    });
    res.status(500).json({ error: err.message, details: err.stack });
  }
});

app.put('/employees/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, hire_date, department_id, role_id } = req.body;
  try {
    console.log('Inicio de PUT /employees/:id', { id });
    console.log('Datos recibidos:', { first_name, last_name, email, hire_date, department_id, role_id });

    const currentEmployee = await pool.query('SELECT * FROM employees WHERE id = $1 AND is_active = TRUE', [id]);
    if (currentEmployee.rows.length === 0) {
      console.log('Empleado no encontrado');
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    const oldData = currentEmployee.rows[0];

    if (email !== oldData.email) {
      const emailCheck = await pool.query('SELECT id FROM employees WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) {
        console.log('Email ya existe en otro empleado:', email);
        return res.status(400).json({ error: 'El email ya está en uso por otro empleado' });
      }
    }

    const result = await pool.query(
      'UPDATE employees SET first_name = $1, last_name = $2, email = $3, hire_date = $4, department_id = $5, role_id = $6 WHERE id = $7 AND is_active = TRUE RETURNING *',
      [first_name, last_name, email, hire_date, department_id, role_id, id]
    );

    const updatedEmployee = result.rows[0];
    console.log('Empleado actualizado:', updatedEmployee);

    const fieldsToCheck = [
      { name: 'hire_date', old: oldData.hire_date, new: hire_date },
      { name: 'department_id', old: oldData.department_id, new: department_id },
      { name: 'role_id', old: oldData.role_id, new: role_id },
    ];

    for (const field of fieldsToCheck) {
      if (field.old !== field.new) {
        await pool.query(
          'INSERT INTO employee_history (employee_id, field_changed, old_value, new_value) VALUES ($1, $2, $3, $4)',
          [id, field.name, field.old?.toString() || null, field.new?.toString() || null]
        );
      }
    }

    res.json(updatedEmployee);
  } catch (err) {
    console.error('Error en PUT /employees/:id:', {
      message: err.message,
      stack: err.stack,
      requestBody: req.body
    });
    res.status(500).json({ error: err.message, details: err.stack });
  }
});

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

app.get('/reports/salaries-by-department', authenticateToken, authorizeRole('admin'), async (req, res) => {
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

    query += ' GROUP BY d.id, d.name ORDER BY d.id';
    const result = await pool.query(query, values);
    console.log('Resultado de /reports/salaries-by-department:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error en GET /reports/salaries-by-department:', err);
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.get('/employees/:id/history', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const employeeId = parseInt(id);
    if (isNaN(employeeId)) {
      return res.status(400).json({ error: 'ID de empleado inválido' });
    }
    if (!req.user.roles.includes('admin') && req.user.employee_id !== employeeId) {
      return res.status(403).json({ error: 'Acceso denegado: Solo puedes ver tu propio historial o necesitas permisos de admin' });
    }
    const result = await pool.query(
      'SELECT * FROM employee_history WHERE employee_id = $1 ORDER BY change_date DESC',
      [employeeId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error en GET /employees/:id/history:', err);
    res.status(500).send(`Error: ${err.message}`);
  }
});

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

app.get('/recognitions', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM recognitions';
    const values = [];
    if (!req.user.roles.includes('admin')) {
      query += ' WHERE employee_id = $1';
      values.push(req.user.employee_id);
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

app.get('/auth/verify', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Token válido' });
});


app.get('/time/entries/:employeeId', authenticateToken, async (req, res) => {
  const { employeeId } = req.params;
  try {
    // Verificar permisos: solo el empleado puede ver sus propios fichajes, o un admin
    if (!req.user.roles.includes('admin') && req.user.employee_id !== parseInt(employeeId)) {
      return res.status(403).json({ error: 'Acceso denegado: Solo puedes ver tus propios fichajes' });
    }

    // Consultar los fichajes del empleado
    const result = await pool.query(
      'SELECT * FROM time_entries WHERE employee_id = $1 ORDER BY clock_in DESC',
      [employeeId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error en GET /time/entries/:employeeId:', err);
    res.status(500).json({ error: err.message });
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

app.post('/time/clock-in', authenticateToken, async (req, res) => {
  const { employee_id } = req.body;
  try {
    // Verificar permisos: solo el empleado puede marcar su entrada, o un admin
    if (!req.user.roles.includes('admin') && req.user.employee_id !== employee_id) {
      return res.status(403).json({ error: 'Acceso denegado: Solo puedes marcar tu propia entrada' });
    }

    // Insertar el registro de entrada
    const result = await pool.query(
      'INSERT INTO time_entries (employee_id, clock_in) VALUES ($1, NOW()) RETURNING *',
      [employee_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error en POST /time/clock-in:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/time/clock-out/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    // Obtener el registro de entrada
    const entryResult = await pool.query(
      'SELECT * FROM time_entries WHERE id = $1',
      [id]
    );

    if (entryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Registro de entrada no encontrado' });
    }

    const entry = entryResult.rows[0];

    // Verificar permisos: solo el empleado puede marcar su salida, o un admin
    if (!req.user.roles.includes('admin') && req.user.employee_id !== entry.employee_id) {
      return res.status(403).json({ error: 'Acceso denegado: Solo puedes marcar tu propia salida' });
    }

    // Calcular el tiempo transcurrido en minutos
    const clockIn = new Date(entry.clock_in);
    const clockOut = new Date();
    const diffMs = clockOut - clockIn;
    const durationMinutes = Math.floor(diffMs / (1000 * 60)); // Diferencia en minutos

    // Actualizar el registro con clock_out y duration
    const result = await pool.query(
      'UPDATE time_entries SET clock_out = NOW(), duration = $1 WHERE id = $2 RETURNING *',
      [durationMinutes, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en PUT /time/clock-out/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));