import { AuthService } from '../src/services/auth.service.js';
const manager = { id: 'user-manager-001', email: 'manager@test.com', name: 'Jane Manager', role: 'Manager' };
console.log(AuthService.generateToken(manager as any));
