const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'skill_swap_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Database initialization
const initDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        profile_photo VARCHAR(500),
        availability JSON,
        is_public BOOLEAN DEFAULT true,
        is_admin BOOLEAN DEFAULT false,
        is_banned BOOLEAN DEFAULT false,
        rating DECIMAL(3,2) DEFAULT 0.00,
        total_ratings INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create skills table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS skills (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_skills table (skills offered by users)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_skills (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        skill_id INT NOT NULL,
        description TEXT,
        experience_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_skill (user_id, skill_id)
      )
    `);

    // Create wanted_skills table (skills wanted by users)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS wanted_skills (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        skill_id INT NOT NULL,
        description TEXT,
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_wanted_skill (user_id, skill_id)
      )
    `);

    // Create swaps table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS swaps (
        id INT PRIMARY KEY AUTO_INCREMENT,
        requester_id INT NOT NULL,
        provider_id INT NOT NULL,
        requested_skill_id INT NOT NULL,
        offered_skill_id INT NOT NULL,
        status ENUM('pending', 'accepted', 'rejected', 'cancelled', 'completed') DEFAULT 'pending',
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (requested_skill_id) REFERENCES skills(id) ON DELETE CASCADE,
        FOREIGN KEY (offered_skill_id) REFERENCES skills(id) ON DELETE CASCADE
      )
    `);

    // Create ratings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        swap_id INT NOT NULL,
        rater_id INT NOT NULL,
        rated_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (swap_id) REFERENCES swaps(id) ON DELETE CASCADE,
        FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (rated_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_swap_rating (swap_id, rater_id)
      )
    `);

    // Create admin_messages table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info', 'warning', 'alert') DEFAULT 'info',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default admin user if not exists
    const [adminUsers] = await connection.execute('SELECT id FROM users WHERE is_admin = true LIMIT 1');
    if (adminUsers.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.execute(`
        INSERT INTO users (name, email, password, is_admin) 
        VALUES ('Admin', 'admin@skillswap.com', ?, true)
      `, [hashedPassword]);
      console.log('✅ Default admin user created');
    }

    // Insert test users if not exists
    const [testUsers] = await connection.execute('SELECT id FROM users WHERE email LIKE "%@test.com" LIMIT 1');
    if (testUsers.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const testUsersData = [
        ['John Developer', 'john@test.com', 'San Francisco, CA', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 4.5, 12],
        ['Sarah Designer', 'sarah@test.com', 'New York, NY', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 4.8, 8],
        ['Mike Chef', 'mike@test.com', 'Los Angeles, CA', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 4.2, 15],
        ['Emma Photographer', 'emma@test.com', 'Chicago, IL', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 4.7, 20],
        ['David Musician', 'david@test.com', 'Austin, TX', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 4.3, 6],
        ['Lisa Writer', 'lisa@test.com', 'Seattle, WA', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 4.6, 10],
        ['Alex Fitness', 'alex@test.com', 'Miami, FL', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face', 4.4, 18],
        ['Maria Language', 'maria@test.com', 'Denver, CO', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face', 4.9, 25]
      ];

      for (const [name, email, location, profile_photo, rating, total_ratings] of testUsersData) {
        await connection.execute(`
          INSERT INTO users (name, email, password, location, profile_photo, rating, total_ratings, is_public) 
          VALUES (?, ?, ?, ?, ?, ?, ?, true)
        `, [name, email, hashedPassword, location, profile_photo, rating, total_ratings]);
      }
      console.log('✅ Test users created');
    } else {
      // Update existing test users to be public
      await connection.execute(`
        UPDATE users 
        SET is_public = true 
        WHERE email LIKE "%@test.com" AND is_public = false
      `);
      console.log('✅ Existing test users updated to public');
    }

    // Add skills to test users
    const [userSkillsCount] = await connection.execute('SELECT COUNT(*) as count FROM user_skills LIMIT 1');
    if (userSkillsCount[0].count === 0) {
      // Get user IDs
      const [users] = await connection.execute('SELECT id, name FROM users WHERE email LIKE "%@test.com"');
      const [skills] = await connection.execute('SELECT id, name FROM skills');
      
      // Create a mapping of skill names to IDs
      const skillMap = {};
      skills.forEach(skill => {
        skillMap[skill.name.toLowerCase()] = skill.id;
      });

      // Define user skills based on their names/professions
      const userSkillsMapping = {
        'John Developer': ['JavaScript', 'Python'],
        'Sarah Designer': ['Photoshop', 'Design'],
        'Mike Chef': ['Cooking'],
        'Emma Photographer': ['Photography'],
        'David Musician': ['Guitar'],
        'Lisa Writer': ['Writing'],
        'Alex Fitness': ['Yoga'],
        'Maria Language': ['Spanish']
      };

      // Define wanted skills for each user
      const wantedSkillsMapping = {
        'John Developer': ['Cooking', 'Photography'],
        'Sarah Designer': ['JavaScript', 'Writing'],
        'Mike Chef': ['Photography', 'Guitar'],
        'Emma Photographer': ['Cooking', 'Spanish'],
        'David Musician': ['Photography', 'Writing'],
        'Lisa Writer': ['JavaScript', 'Yoga'],
        'Alex Fitness': ['Cooking', 'Spanish'],
        'Maria Language': ['Guitar', 'Photography']
      };

      for (const user of users) {
        // Add offered skills
        const offeredSkills = userSkillsMapping[user.name] || [];
        for (const skillName of offeredSkills) {
          const skillId = skillMap[skillName.toLowerCase()];
          if (skillId) {
            await connection.execute(`
              INSERT INTO user_skills (user_id, skill_id, experience_level) 
              VALUES (?, ?, ?)
            `, [user.id, skillId, 'advanced']);
          }
        }

        // Add wanted skills
        const wantedSkills = wantedSkillsMapping[user.name] || [];
        for (const skillName of wantedSkills) {
          const skillId = skillMap[skillName.toLowerCase()];
          if (skillId) {
            await connection.execute(`
              INSERT INTO wanted_skills (user_id, skill_id, priority) 
              VALUES (?, ?, ?)
            `, [user.id, skillId, 'high']);
          }
        }
      }
      console.log('✅ User skills added');
    }

    // Add sample swaps
    const [swapsCount] = await connection.execute('SELECT COUNT(*) as count FROM swaps LIMIT 1');
    if (swapsCount[0].count === 0) {
      // Get user IDs and their skills
      const [users] = await connection.execute('SELECT id, name FROM users WHERE email LIKE "%@test.com"');
      const [userSkills] = await connection.execute(`
        SELECT us.user_id, us.skill_id, s.name as skill_name, u.name as user_name
        FROM user_skills us
        JOIN skills s ON us.skill_id = s.id
        JOIN users u ON us.user_id = u.id
      `);
      const [wantedSkills] = await connection.execute(`
        SELECT ws.user_id, ws.skill_id, s.name as skill_name, u.name as user_name
        FROM wanted_skills ws
        JOIN skills s ON ws.skill_id = s.id
        JOIN users u ON ws.user_id = u.id
      `);

      // Create some sample swaps
      const sampleSwaps = [
        {
          requester: 'John Developer',
          provider: 'Mike Chef',
          requested_skill: 'Cooking',
          offered_skill: 'JavaScript',
          status: 'accepted',
          message: 'I would love to learn some basic cooking techniques!'
        },
        {
          requester: 'Sarah Designer',
          provider: 'John Developer',
          requested_skill: 'JavaScript',
          offered_skill: 'Photoshop',
          status: 'pending',
          message: 'Looking to learn web development basics'
        },
        {
          requester: 'Emma Photographer',
          provider: 'David Musician',
          requested_skill: 'Guitar',
          offered_skill: 'Photography',
          status: 'completed',
          message: 'I want to learn guitar for my photography sessions'
        },
        {
          requester: 'Lisa Writer',
          provider: 'Alex Fitness',
          requested_skill: 'Yoga',
          offered_skill: 'Writing',
          status: 'accepted',
          message: 'Need some stress relief techniques for my writing'
        },
        {
          requester: 'Maria Language',
          provider: 'Emma Photographer',
          requested_skill: 'Photography',
          offered_skill: 'Spanish',
          status: 'pending',
          message: 'I want to improve my photography skills'
        }
      ];

      for (const swap of sampleSwaps) {
        // Find user IDs
        const requester = users.find(u => u.name === swap.requester);
        const provider = users.find(u => u.name === swap.provider);
        
        if (requester && provider) {
          // Find skill IDs
          const requestedSkill = wantedSkills.find(ws => 
            ws.user_name === swap.requester && ws.skill_name === swap.requested_skill
          );
          const offeredSkill = userSkills.find(us => 
            us.user_name === swap.provider && us.skill_name === swap.offered_skill
          );

          if (requestedSkill && offeredSkill) {
            await connection.execute(`
              INSERT INTO swaps (requester_id, provider_id, requested_skill_id, offered_skill_id, status, message) 
              VALUES (?, ?, ?, ?, ?, ?)
            `, [requester.id, provider.id, requestedSkill.skill_id, offeredSkill.skill_id, swap.status, swap.message]);
          }
        }
      }
      console.log('✅ Sample swaps created');
    }

    // Insert some default skills
    const [existingSkills] = await connection.execute('SELECT id FROM skills LIMIT 1');
    if (existingSkills.length === 0) {
      const defaultSkills = [
        ['JavaScript', 'Programming language for web development', 'Programming'],
        ['Python', 'General-purpose programming language', 'Programming'],
        ['Photoshop', 'Image editing and graphic design', 'Design'],
        ['Excel', 'Spreadsheet and data analysis', 'Business'],
        ['Cooking', 'Culinary arts and meal preparation', 'Lifestyle'],
        ['Photography', 'Digital and film photography', 'Arts'],
        ['Guitar', 'Musical instrument instruction', 'Music'],
        ['Spanish', 'Spanish language instruction', 'Language'],
        ['Yoga', 'Physical and mental wellness', 'Fitness'],
        ['Writing', 'Creative and technical writing', 'Communication']
      ];

      for (const [name, description, category] of defaultSkills) {
        await connection.execute(`
          INSERT INTO skills (name, description, category) 
          VALUES (?, ?, ?)
        `, [name, description, category]);
      }
      console.log('✅ Default skills added');
    }

    connection.release();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

module.exports = { pool, initDatabase }; 