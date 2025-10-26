/*Only for testing purposes*/
DROP DATABASE IF EXISTS usof_db;

CREATE DATABASE IF NOT EXISTS usof_db;

CREATE USER IF NOT EXISTS 'admin'@'localhost' IDENTIFIED BY 'adminsecurepass';

GRANT ALL PRIVILEGES ON usof_db.* TO 'admin'@'localhost';

FLUSH PRIVILEGES;

USE usof_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    email_confirmed BOOLEAN DEFAULT FALSE,
    email_confirmation_token VARCHAR(100) DEFAULT NULL,
    password_reset_token VARCHAR(100) DEFAULT NULL,
    password_reset_token_expiration DATETIME DEFAULT NULL,
    profile_picture VARCHAR(255) DEFAULT 'uploads/default_profile.png',
    rating INT DEFAULT 0,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    author_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active',
    is_locked BOOLEAN DEFAULT FALSE,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS post_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    FOREIGN  KEY (post_id)  REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
CREATE TABLE IF NOT EXISTS post_categories (
    post_id INT NOT NULL,
    category_id  INT NOT NULL,
    PRIMARY KEY (post_id, category_id),
    FOREIGN KEY (post_id) REFERENCES posts(id)  ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    author_id INT NOT NULL,
    content TEXT NOT NULL,
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    parent_comment_id INT DEFAULT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    likes_count INT DEFAULT 0,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    author_id INT NOT NULL,
    target_type ENUM('post', 'comment') NOT NULL,
    type ENUM('like', 'dislike') NOT NULL,
    target_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (author_id, target_type, target_id),
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT NOT NULL,
    post_id INT DEFAULT NULL,
    comment_id INT DEFAULT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME DEFAULT NULL,
    admin_id INT DEFAULT NULL,
    admin_action ENUM('ignored', 'deleted', 'warned') DEFAULT NULL,
    admin_message TEXT DEFAULT NULL,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_collection (user_id, title),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS collection_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collection_id INT NOT NULL,
    post_id INT NOT NULL,
    UNIQUE KEY unique_collection_post (collection_id, post_id),
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS follow_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    UNIQUE KEY unique_follow (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS  notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    author_id INT DEFAULT NULL,
    target_type ENUM('post', 'comment', 'report') NOT NULL,
    target_id INT DEFAULT NULL,
    message VARCHAR(255) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* ===================================================================
-- Initial Data Insertion
-- ===================================================================
All user passwords: "Password123"*/

INSERT INTO users (login, full_name, password, email, email_confirmed, rating, role, created_at) VALUES
('admin', 'Admin User', '$2b$10$rT5qzQXJ8h8D9CfKvxN0eeYfJ1WqQXYJYqvQf1ZqKzQXYJYqvQf1Z', 'admin@usof.com', TRUE, 0, 'admin', '2025-01-10 10:00:00'),
('jovannni_ay', 'Jovanni Ay', '$2b$10$rT5qzQXJ8h8D9CfKvxN0eeYfJ1WqQXYJYqvQf1ZqKzQXYJYqvQf1Z', 'john@example.com', TRUE, 10, 'user', '2025-01-11 09:30:00'),
('jane_smith', 'Jane Smith', '$2b$10$rT5qzQXJ8h8D9CfKvxN0eeYfJ1WqQXYJYqvQf1ZqKzQXYJYqvQf1Z', 'jane@example.com', TRUE, 8, 'user', '2025-01-11 11:15:00'),
('bob_wilson', 'Bob Wilson', '$2b$10$rT5qzQXJ8h8D9CfKvxN0eeYfJ1WqQXYJYqvQf1ZqKzQXYJYqvQf1Z', 'bob@example.com', TRUE, 8, 'user', '2025-01-12 08:45:00'),
('alice_brown', 'Alice Brown', '$2b$10$rT5qzQXJ8h8D9CfKvxN0eeYfJ1WqQXYJYqvQf1ZqKzQXYJYqvQf1Z', 'alice@example.com', TRUE, 8, 'user', '2025-01-12 14:20:00'),
('charlie_davis', 'Charlie Davis', '$2b$10$rT5qzQXJ8h8D9CfKvxN0eeYfJ1WqQXYJYqvQf1ZqKzQXYJYqvQf1Z', 'charlie@example.com', TRUE, 1, 'user', '2025-01-13 10:30:00'),
('emma_johnson', 'Emma Johnson', '$2b$10$rT5qzQXJ8h8D9CfKvxN0eeYfJ1WqQXYJYqvQf1ZqKzQXYJYqvQf1Z', 'emma@example.com', TRUE, 0, 'user', '2025-01-13 16:45:00'),
('david_lee', 'David Lee', '$2b$10$rT5qzQXJ8h8D9CfKvxN0eeYfJ1WqQXYJYqvQf1ZqKzQXYJYqvQf1Z', 'david@example.com', FALSE, 0, 'user', '2025-01-14 12:00:00');

INSERT INTO categories (title) VALUES
('JavaScript'),
('Python'),
('MySQL'),
('Node.js'),
('React'),
('PHP'),
('CSS'),
('HTML'),
('Database Design'),
('API Development');

INSERT INTO posts (author_id, title, content, published_at, status, is_locked, likes_count, comments_count) VALUES
(2, 'How to fix MySQL connection error?', 'I am getting a "Connection refused" error when trying to connect to my MySQL database. I have checked the credentials and they are correct. What could be the issue?\n\nMy connection code:\nconst mysql = require("mysql2");\nconst connection = mysql.createConnection({\n  host: "localhost",\n  user: "root",\n  password: "password",\n  database: "mydb"\n});', '2025-01-14 10:00:00', 'active', FALSE, 5, 3),
(3, 'Best practices for React hooks?', 'I am new to React hooks and wondering what are the best practices when using useState and useEffect? Should I always use useCallback? Any tips would be appreciated!', '2025-01-14 11:30:00', 'active', FALSE, 8, 5),
(4, 'How to implement JWT authentication in Node.js?', 'I want to add JWT authentication to my Node.js API. What is the best approach? Should I use a library or implement it myself?\n\nI need to:\n- Generate tokens on login\n- Verify tokens on protected routes\n- Handle token expiration\n\nAny code examples would be helpful!', '2025-01-14 13:15:00', 'active', FALSE, 12, 7),
(5, 'Difference between JOIN types in SQL?', 'Can someone explain the difference between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN with examples? I always get confused about which one to use.', '2025-01-14 15:45:00', 'active', FALSE, 15, 4),
(6, 'How to center a div in CSS?', 'What is the modern way to center a div both horizontally and vertically in CSS? I have tried margin: auto but it only works horizontally.', '2025-01-14 17:20:00', 'active', FALSE, 3, 2),
(7, 'Python list comprehension vs for loop performance?', 'Which is faster: list comprehension or traditional for loop in Python? Does it make a significant difference for large datasets?', '2025-01-15 09:00:00', 'active', FALSE, 6, 4),
(2, 'Understanding async/await in JavaScript', 'I am confused about when to use async/await vs promises. Can someone explain the difference and when each approach is better?', '2025-01-15 11:30:00', 'active', FALSE, 9, 6),
(3, 'How to prevent SQL injection?', 'What are the best practices to prevent SQL injection attacks in PHP? I have heard about prepared statements but not sure how to implement them properly.', '2025-01-15 14:00:00', 'inactive', FALSE, 2, 1);

INSERT INTO post_categories (post_id, category_id) VALUES
(1, 3), (1, 4),
(2, 5),
(3, 4), (3, 10),
(4, 3), (4, 9),
(5, 7),
(6, 2),
(7, 1),
(8, 1), (8, 4), (8, 6);

INSERT INTO comments (post_id, author_id, content, published_at, parent_comment_id, status, likes_count) VALUES
(1, 3, 'Check if MySQL service is running. Use "systemctl status mysql" on Linux or check Services on Windows.', '2025-01-14 10:15:00', NULL, 'active', 2),
(1, 4, 'Also make sure the port 3306 is not blocked by firewall.', '2025-01-14 10:30:00', 1, 'active', 1),
(1, 2, 'Thanks! It was the firewall blocking the port.', '2025-01-14 10:45:00', 2, 'active', 0),

(2, 4, 'Always include dependencies in useEffect array. Use ESLint plugin for React hooks to catch missing dependencies.', '2025-01-14 12:00:00', NULL, 'active', 3),
(2, 5, 'useCallback is useful when passing callbacks to child components to prevent unnecessary re-renders.', '2025-01-14 12:15:00', NULL, 'active', 4),
(2, 6, 'Great advice! I will try the ESLint plugin.', '2025-01-14 12:30:00', 4, 'active', 1),
(2, 3, 'Also check out the React docs on hooks, they have great examples.', '2025-01-14 13:00:00', NULL, 'active', 2),
(2, 7, 'Do not forget about useRef for accessing DOM elements!', '2025-01-14 13:30:00', NULL, 'active', 1),

(3, 2, 'Use jsonwebtoken library. Here is a basic example: jwt.sign({userId: user.id}, "secret", {expiresIn: "1h"})', '2025-01-14 14:00:00', NULL, 'active', 5),
(3, 5, 'Do not forget to validate the token on every protected route using middleware.', '2025-01-14 14:20:00', 1, 'active', 3),
(3, 6, 'Store the secret in environment variables, never hardcode it!', '2025-01-14 14:40:00', 1, 'active', 4),
(3, 7, 'You can also use refresh tokens for better security.', '2025-01-14 15:00:00', NULL, 'active', 2),
(3, 3, 'Check out Passport.js for a more complete authentication solution.', '2025-01-14 15:20:00', NULL, 'active', 1),
(3, 4, 'Thanks everyone! This is very helpful.', '2025-01-14 15:40:00', NULL, 'active', 0),
(3, 5, 'You are welcome! Good luck with your project.', '2025-01-14 16:00:00', 6, 'active', 1),

(4, 2, 'INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from left table and matching from right.', '2025-01-14 16:30:00', NULL, 'active', 6),
(4, 6, 'Here is a visual guide: https://sql-joins.com - very helpful!', '2025-01-14 16:45:00', 1, 'active', 3),
(4, 3, 'RIGHT JOIN is rarely used, usually you can rewrite it as LEFT JOIN.', '2025-01-14 17:00:00', NULL, 'active', 2),
(4, 5, 'Perfect explanation! Now I understand it.', '2025-01-14 17:15:00', 1, 'active', 1),

(5, 3, 'Use flexbox: display: flex; justify-content: center; align-items: center; on parent container.', '2025-01-14 18:00:00', NULL, 'active', 1),
(5, 7, 'Or use CSS Grid: display: grid; place-items: center; - even simpler!', '2025-01-14 18:15:00', NULL, 'active', 2);

INSERT INTO likes (author_id, target_type, type, target_id, created_at) VALUES
(3, 'post', 'like', 1, '2025-01-14 10:20:00'),
(4, 'post', 'like', 1, '2025-01-14 10:25:00'),
(5, 'post', 'like', 1, '2025-01-14 10:35:00'),
(6, 'post', 'like', 1, '2025-01-14 11:00:00'),
(7, 'post', 'like', 1, '2025-01-14 11:30:00'),

(2, 'post', 'like', 2, '2025-01-14 12:00:00'),
(4, 'post', 'like', 2, '2025-01-14 12:10:00'),
(5, 'post', 'like', 2, '2025-01-14 12:30:00'),
(6, 'post', 'like', 2, '2025-01-14 13:00:00'),
(7, 'post', 'like', 2, '2025-01-14 13:15:00'),
(3, 'post', 'like', 2, '2025-01-14 13:45:00'),

(2, 'post', 'like', 3, '2025-01-14 14:30:00'),
(3, 'post', 'like', 3, '2025-01-14 14:45:00'),
(4, 'post', 'like', 3, '2025-01-14 15:00:00'),
(5, 'post', 'like', 3, '2025-01-14 15:15:00'),
(6, 'post', 'like', 3, '2025-01-14 17:00:00'),
(7, 'post', 'dislike', 3, '2025-01-14 17:15:00'),

(2, 'post', 'like', 4, '2025-01-14 16:00:00'),
(3, 'post', 'like', 4, '2025-01-14 16:15:00'),
(5, 'post', 'like', 4, '2025-01-14 16:45:00'),
(6, 'post', 'like', 4, '2025-01-14 17:00:00'),
(7, 'post', 'like', 4, '2025-01-14 17:15:00'),
(4, 'post', 'dislike', 4, '2025-01-14 19:30:00'),

(2, 'post', 'like', 5, '2025-01-14 18:00:00'),
(3, 'post', 'like', 5, '2025-01-14 18:15:00'),
(4, 'post', 'dislike', 5, '2025-01-14 18:30:00');

INSERT INTO likes (author_id, target_type, type, target_id, created_at) VALUES
(2, 'comment', 'like', 1, '2025-01-14 10:20:00'),
(5, 'comment', 'like', 1, '2025-01-14 10:25:00'),
(4, 'comment', 'like', 2, '2025-01-14 10:35:00'),
(2, 'comment', 'like', 4, '2025-01-14 12:05:00'),
(3, 'comment', 'like', 4, '2025-01-14 12:10:00'),
(6, 'comment', 'like', 4, '2025-01-14 12:20:00'),
(2, 'comment', 'like', 5, '2025-01-14 12:20:00'),
(3, 'comment', 'like', 5, '2025-01-14 12:25:00'),
(4, 'comment', 'like', 5, '2025-01-14 12:35:00'),
(7, 'comment', 'like', 5, '2025-01-14 12:40:00'),
(3, 'comment', 'like', 9, '2025-01-14 14:05:00'),
(4, 'comment', 'like', 9, '2025-01-14 14:10:00'),
(5, 'comment', 'like', 9, '2025-01-14 14:15:00'),
(6, 'comment', 'like', 9, '2025-01-14 14:20:00'),
(7, 'comment', 'like', 9, '2025-01-14 14:25:00');
 
INSERT INTO collections (user_id, title, description, is_private, created_at) VALUES
(2, 'My Favorite Solutions', 'Posts that helped me solve difficult problems', FALSE, '2025-01-14 10:00:00'),
(3, 'React Resources', 'Best React-related questions and answers', FALSE, '2025-01-14 11:00:00'),
(4, 'Node.js Tips', 'Useful Node.js patterns and practices', TRUE, '2025-01-14 12:00:00'),
(5, 'Database Design', 'SQL and database related posts', FALSE, '2025-01-14 13:00:00'),
(6, 'CSS Tricks', 'Modern CSS solutions', FALSE, '2025-01-14 14:00:00'),
(7, 'Python Best Practices', 'Python coding standards and tips', TRUE, '2025-01-14 15:00:00');

INSERT INTO collection_posts (collection_id, post_id) VALUES
(1, 1), (1, 3),
(2, 2),
(3, 3), (3, 7),
(4, 1), (4, 4),
(5, 5),
(6, 6);

INSERT INTO follow_posts (user_id, post_id) VALUES
(2, 2), (2, 3), (2, 4),
(3, 1), (3, 3), (3, 7),
(4, 2), (4, 4),
(5, 1), (5, 2), (5, 3),
(6, 3), (6, 4), (6, 5),
(7, 1), (7, 2);

INSERT INTO notifications (user_id, author_id, target_type, target_id, message, is_read, created_at) VALUES
(2, 3, 'comment', 1, 'New comment on your post: "How to fix MySQL connection error?"', FALSE, '2025-01-14 10:15:00'),
(2, 4, 'comment', 2, 'New comment on post you follow: "Best practices for React hooks?"', TRUE, '2025-01-14 10:30:00'),
(3, 4, 'comment', 4, 'New comment on your post: "Best practices for React hooks?"', FALSE, '2025-01-14 12:00:00'),
(3, 5, 'comment', 5, 'New comment on your post: "Best practices for React hooks?"', FALSE, '2025-01-14 12:15:00'),
(4, 2, 'comment', 9, 'New comment on your post: "How to implement JWT authentication in Node.js?"', TRUE, '2025-01-14 14:00:00'),
(5, 2, 'comment', 14, 'New comment on your post: "Difference between JOIN types in SQL?"', FALSE, '2025-01-14 16:30:00'),
(6, 3, 'comment', 17, 'New comment on your post: "How to center a div in CSS?"', FALSE, '2025-01-14 18:00:00');

INSERT INTO reports (reporter_id, post_id, comment_id, reason, status, created_at, resolved_at, admin_id, admin_action, admin_message) VALUES
(3, 8, NULL, 'This post contains outdated and potentially unsafe SQL practices', 'resolved', '2025-01-15 14:30:00', '2025-01-15 15:00:00', 1, 'deleted', 'Post contained outdated security practices and was marked as inactive'),
(4, NULL, 3, 'Spam comment with irrelevant content', 'pending', '2025-01-15 16:00:00', NULL, NULL, NULL, NULL),
(5, 1, NULL, 'Duplicate question already answered elsewhere', 'reviewed', '2025-01-15 17:00:00', NULL, 1, NULL, NULL),
(6, NULL, 8, 'Rude and unhelpful comment', 'pending', '2025-01-15 18:00:00', NULL, NULL, NULL, NULL),
(7, 5, NULL, 'Low quality question with no research effort', 'resolved', '2025-01-15 19:00:00', '2025-01-15 19:30:00', 1, 'ignored', 'Question is acceptable for beginners');

/* Updating tables to reflect data based on inserted data */
UPDATE users u SET rating = (
    SELECT COALESCE(SUM(
        CASE WHEN l.type = 'like' THEN 1 
             WHEN l.type = 'dislike' THEN -1 
             ELSE 0 END
    ), 0)
    FROM likes l
    LEFT JOIN posts p ON l.target_type = 'post' AND l.target_id = p.id
    LEFT JOIN comments c ON l.target_type = 'comment' AND l.target_id = c.id
    WHERE p.author_id = u.id OR c.author_id = u.id
);

UPDATE posts p SET likes_count = (
    SELECT COALESCE(SUM(CASE WHEN type = 'like' THEN 1 WHEN type = 'dislike' THEN -1 ELSE 0 END), 0)
    FROM likes 
    WHERE target_type = 'post' AND target_id = p.id
);

UPDATE posts p SET comments_count = (
    SELECT COUNT(*) 
    FROM comments 
    WHERE post_id = p.id AND status = 'active'
);

UPDATE comments c SET likes_count = (
    SELECT COALESCE(SUM(CASE WHEN type = 'like' THEN 1 WHEN type = 'dislike' THEN -1 ELSE 0 END), 0)
    FROM likes 
    WHERE target_type = 'comment' AND target_id = c.id
);
