-- creating students table
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    age INT NOT NULL
);

-- inserting values into students table
INSERT INTO students (name, email, age) VALUES
('Jack Mpobane', 'jack@example.com', 19),
('Thande Ndlovu', 'thande@example.com', 21),
('Hope Mpofu', 'hope@example.com', 20);

-- creating course table
CREATE TABLE courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_name VARCHAR(100) NOT NULL
);

-- inserting values into courses table
INSERT INTO courses (course_name) VALUES
('Mathematics'),
('Biology'),
('History');

-- creating enrollments table
CREATE TABLE enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    grade VARCHAR(10) DEFAULT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE (student_id, course_id)
);

-- inserting values into enrollments table
INSERT INTO enrollments (student_id, course_id, grade) VALUES
(1, 1, 'A'),
(1, 2, 'B'),
(2, 1, 'A'),
(2, 3, 'C'),
(3, 2, 'B');

-- step1 All courses for one student (by name)
SELECT c.course_name
FROM students s
JOIN enrollments e ON s.id = e.student_id
JOIN courses c ON e.course_id = c.id
WHERE s.name = 'Jack Mpobane';

-- step2. Get all students enrolled in a specific course
SELECT s.name
FROM courses c
JOIN enrollments e ON c.id = e.course_id
JOIN students s ON e.student_id = s.id
WHERE c.course_name = 'Mathematics';

-- step3. Number of students per course
SELECT c.course_name, COUNT(e.student_id) AS student_count
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
GROUP BY c.id, c.course_name;

-- step4. Students who have no enrolments
SELECT s.*
FROM students s
LEFT JOIN enrollments e ON s.id = e.student_id
WHERE e.id IS NULL;

-- step5. Update one enrolment's grade
UPDATE enrollments
SET grade = 'A+'
WHERE id = 2;