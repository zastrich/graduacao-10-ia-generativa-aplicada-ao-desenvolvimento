import bcrypt from 'bcryptjs';

describe('UserService Unit Tests', () => {
  it('should hash password correctly', async () => {
    const rawPassword = 'secretPassword123';
    const hash = await bcrypt.hash(rawPassword, 10);
    const matches = await bcrypt.compare(rawPassword, hash);
    expect(matches).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const rawPassword = 'secretPassword123';
    const hash = await bcrypt.hash(rawPassword, 10);
    const matches = await bcrypt.compare('wrongPassword', hash);
    expect(matches).toBe(false);
  });
});
