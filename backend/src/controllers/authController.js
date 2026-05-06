import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

function buildToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'change-me',
    {
      expiresIn: '7d'
    }
  );
}

function mapUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    status: row.status,
    riderProfile: row.role === 'rider'
      ? {
          bikePlate: row.bike_plate,
          currentZone: row.current_zone,
          rating: row.rating ? Number(row.rating) : 0,
          completedTrips: row.completed_trips || 0,
          totalEarnings: row.total_earnings ? Number(row.total_earnings) : 0
        }
      : null
  };
}

async function getUserById(userId, includePassword = false) {
  const fields = [
    'u.id',
    'u.full_name',
    'u.email',
    'u.phone',
    'u.role',
    'u.status',
    'rp.bike_plate',
    'rp.current_zone',
    'rp.rating',
    'rp.completed_trips',
    'rp.total_earnings'
  ];

  if (includePassword) {
    fields.push('u.password_hash');
  }

  const rows = await query(
    `
      SELECT ${fields.join(', ')}
      FROM users u
      LEFT JOIN rider_profiles rp ON rp.user_id = u.id
      WHERE u.id = ?
      LIMIT 1
    `,
    [userId]
  );

  return rows[0];
}

export async function register(req, res, next) {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      role = 'customer',
      bikePlate,
      currentZone = 'City Centre'
    } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: 'Full name, email, phone, and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const safeRole = ['customer', 'rider', 'admin'].includes(role) ? role : 'customer';

    const existingUsers = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `
        INSERT INTO users (full_name, email, phone, password_hash, role, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `,
      [fullName, normalizedEmail, phone, passwordHash, safeRole]
    );

    if (safeRole === 'rider') {
      await query(
        `
          INSERT INTO rider_profiles (user_id, bike_plate, current_zone, is_available)
          VALUES (?, ?, ?, 1)
        `,
        [result.insertId, bikePlate || 'TBA', currentZone]
      );
    }

    const userRow = await getUserById(result.insertId);
    const user = mapUser(userRow);

    return res.status(201).json({
      message: 'Registration completed.',
      token: buildToken(user),
      user
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const rows = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [String(email).trim().toLowerCase()]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const userRow = await getUserById(rows[0].id, true);
    const isValid = await bcrypt.compare(password, userRow.password_hash);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = mapUser(userRow);

    return res.json({
      message: 'Login successful.',
      token: buildToken(user),
      user
    });
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res, next) {
  try {
    const userRow = await getUserById(req.user.id);

    if (!userRow) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ user: mapUser(userRow) });
  } catch (error) {
    return next(error);
  }
}
