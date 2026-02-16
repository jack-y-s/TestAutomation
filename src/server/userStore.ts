import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

const USERS_FILE = path.join(process.cwd(), 'users.json');
const SALT_ROUNDS = 10;

export interface User {
  username: string;
  email: string;
  password: string; // hashed
  createdAt: string;
}

// Initialize users file with default user if it doesn't exist
function initializeUsersFile(): void {
  if (!fs.existsSync(USERS_FILE)) {
    const defaultPasswordHash = bcrypt.hashSync('testautomation123', SALT_ROUNDS);
    const defaultUsers: User[] = [
      {
        username: 'automation',
        email: 'automation@test.com',
        password: defaultPasswordHash,
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  }
}

function readUsers(): User[] {
  initializeUsersFile();
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data);
}

function writeUsers(users: User[]): void {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function findUserByUsername(username: string): User | undefined {
  const users = readUsers();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function findUserByEmail(email: string): User | undefined {
  const users = readUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(username: string, email: string, password: string): { success: boolean; message: string } {
  const users = readUsers();
  
  // Check if username exists
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, message: 'Username already exists' };
  }
  
  // Check if email exists
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, message: 'Email already exists' };
  }
  
  // Hash password and create user
  const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
  const newUser: User = {
    username,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  writeUsers(users);
  
  return { success: true, message: 'User created successfully' };
}

export function validatePassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.password);
}

export function isNewUser(user: User): boolean {
  const createdAt = new Date(user.createdAt);
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  // User is considered "new" if registered within the last 24 hours
  return hoursSinceCreation < 24;
}

export function resetPassword(username: string, newPassword: string): { success: boolean; message: string } {
  const users = readUsers();
  const userIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (userIndex === -1) {
    return { success: false, message: 'User not found' };
  }
  
  const hashedPassword = bcrypt.hashSync(newPassword, SALT_ROUNDS);
  users[userIndex].password = hashedPassword;
  writeUsers(users);
  
  return { success: true, message: 'Password reset successfully' };
}

// Initialize on module load
initializeUsersFile();
