CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    pair VARCHAR(20) NOT NULL DEFAULT 'CPO/TOR',
    type ENUM('buy', 'sell') NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    amount_filled DECIMAL(20, 8) NOT NULL DEFAULT 0.00000000,
    status ENUM('open', 'partial', 'filled', 'cancelled') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE trades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buy_order_id INT NOT NULL,
    sell_order_id INT NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buy_order_id) REFERENCES orders(id),
    FOREIGN KEY (sell_order_id) REFERENCES orders(id)
);
CREATE TABLE transfer_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id BIGINT UNSIGNED NOT NULL,
  recipient_id BIGINT UNSIGNED NOT NULL,
  coin_type ENUM('unlock_cpo', 'tor') NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  memo VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (recipient_id) REFERENCES users(id)
);