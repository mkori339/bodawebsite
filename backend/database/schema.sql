CREATE DATABASE IF NOT EXISTS bodarequest;
USE bodarequest;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(30) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'rider', 'admin') NOT NULL DEFAULT 'customer',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rider_profiles (
  user_id INT PRIMARY KEY,
  bike_plate VARCHAR(60) NOT NULL DEFAULT 'TBA',
  current_zone VARCHAR(120) NOT NULL DEFAULT 'City Centre',
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  rating DECIMAL(3, 2) NOT NULL DEFAULT 4.80,
  completed_trips INT NOT NULL DEFAULT 0,
  total_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rider_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ride_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  rider_id INT NULL,
  pickup_location VARCHAR(180) NOT NULL,
  destination_location VARCHAR(180) NOT NULL,
  pickup_note VARCHAR(180) NULL,
  destination_note VARCHAR(180) NULL,
  requested_pickup_time DATETIME NULL,
  distance_km DECIMAL(6, 2) NOT NULL,
  estimated_cost DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('demo_wallet', 'cash') NOT NULL DEFAULT 'demo_wallet',
  payment_status ENUM('pending', 'paid', 'refunded') NOT NULL DEFAULT 'pending',
  ride_status ENUM('pending_payment', 'waiting_rider', 'rider_assigned', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending_payment',
  priority ENUM('standard', 'express', 'scheduled') NOT NULL DEFAULT 'standard',
  passenger_count INT NOT NULL DEFAULT 1,
  helmet_required TINYINT(1) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  accepted_at DATETIME NULL,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ride_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ride_rider FOREIGN KEY (rider_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_ride_status (ride_status),
  INDEX idx_customer_created (customer_id, created_at),
  INDEX idx_rider_created (rider_id, created_at)
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ride_id INT NOT NULL,
  customer_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  method ENUM('demo_wallet', 'cash') NOT NULL DEFAULT 'demo_wallet',
  transaction_ref VARCHAR(120) NOT NULL UNIQUE,
  payment_status ENUM('successful', 'failed', 'reversed') NOT NULL DEFAULT 'successful',
  paid_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_ride FOREIGN KEY (ride_id) REFERENCES ride_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_paid_at (paid_at)
);
