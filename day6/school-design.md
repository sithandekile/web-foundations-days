# School Database Design

## Tables and their purpose

### students
The `students` table stores each student’s personal details. It includes the student’s unique ID, full name, email, and age. This table is the main record for each student.

### courses
The `courses` table stores the available subjects or classes in the school. Each course has a unique ID and a course name. This table lists what the school offers.

### enrollments
The `enrollments` table connects students to courses. It records which student is enrolled in which course, the grade they received, and the date of enrollment. This table is the bridge between the two main entities.

## Relationships

### One-to-many relationship
A one-to-many relationship is between `students` and `enrollments` because one student can have many enrollment records. Each enrollment row belongs to one student, but one student can appear in many enrollment rows.

The same idea applies to `courses` and `enrollments`: one course can have many enrollment records, but each enrollment belongs to one course.

### Many-to-many relationship
The relationship between `students` and `courses` is many-to-many. A student can enroll in many courses, and a course can have many students. A direct link between the two tables would be awkward and would create repeated data.

That is why a join table called `enrollments` is needed. It stores each student-course pair as a separate row, which keeps the data normalized and avoids duplication.

## Why a join table is needed
A join table is needed because many-to-many relationships cannot be stored directly in a single column or table without repeating data. The `enrollments` table allows the system to track details such as grade and enrollment date for each student-course connection.

## One useful index
I would add an index on `enrollments(course_id)` because many queries will likely look up all students in a specific course or count how many students are in a course. Indexing `course_id` makes these lookups faster and improves performance when joining `courses` and `enrollments`.

## SQL or NoSQL?
I would choose SQL for this system because the data is structured and relational. The schema includes clear entities (`students`, `courses`, and `enrollments`) and relationships between them, which fits the strengths of a relational database. SQL also supports foreign keys, uniqueness rules, and query operations like joins, which are important for tracking enrollments and grade data. NoSQL would be more useful if the system needed flexible, unstructured data or very large-scale document-based storage, but for a school enrollment system, I believe SQL is the best fit.
