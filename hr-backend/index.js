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

// Endpoint de login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length > 0) {
      const match = await bcrypt.compare(password, rows[0].password);
      if (match) {
        const token = jwt.sign(
          { id: rows[0].id, email: rows[0].email, role: rows[0].role },
          JWT_SECRET,
          { expiresIn: '1h' }
        );
        res.json({ success: true, token });
      } else {
        res.status(401).json({ success: false, message: 'Credenciales no válidas' });
      }
    } else {
      res.status(401).json({ success: false, message: 'Credenciales no válidas' });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para cambiar contraseña
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
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
    res.json({ message: 'Contraseña actualizada con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Empleados ---

app.get('/employees/inactive', async (req, res) => {
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

app.get('/employees', async (req, res) => {
  try {
    const { department_id, hire_date_start, hire_date_end, salary_min, salary_max } = req.query;
    let query = 'SELECT e.*, r.salary FROM employees e JOIN roles r ON e.role_id = r.id WHERE e.is_active = TRUE';
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
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/employees/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM employees WHERE id = $1 AND is_active = TRUE', [id]);
    if (result.rows.length === 0) return res.status(404).send('Empleado no encontrado');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.get('/dashboard', async (req, res) => {
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

app.get('/dashboard/dept-distribution', async (req, res) => {
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

app.post('/employees', async (req, res) => {
  const { first_name, last_name, email, hire_date, department_id, role_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO employees (first_name, last_name, email, hire_date, department_id, role_id, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [first_name, last_name, email, hire_date, department_id, role_id, true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.put('/employees/:id', async (req, res) => {
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

app.delete('/employees/:id', async (req, res) => {
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
app.get('/departments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.post('/departments', async (req, res) => {
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

app.put('/departments/:id', async (req, res) => {
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

app.delete('/departments/:id', async (req, res) => {
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
app.get('/roles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.post('/roles', async (req, res) => {
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

app.put('/roles/:id', async (req, res) => {
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

app.delete('/roles/:id', async (req, res) => {
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
app.get('/reports/salaries-by-department', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        d.name AS department_name,
        COUNT(e.id) AS employee_count,
        SUM(r.salary) AS total_salary,
        AVG(r.salary) AS avg_salary
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.is_active = TRUE
      LEFT JOIN roles r ON e.role_id = r.id
      GROUP BY d.id, d.name
      ORDER BY d.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.get('/employees/:id/history', async (req, res) => {
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

app.put('/employees/:id/restore', async (req, res) => {
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

app.get('/recognitions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT * FROM recognitions ORDER BY date DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const total = await pool.query('SELECT COUNT(*) FROM recognitions');
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

app.post('/recognitions', async (req, res) => {
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

app.delete('/recognitions/:id', async (req, res) => {
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

// Iniciar el servidor
app.listen(3001, () => console.log('Server running on port 3001'));