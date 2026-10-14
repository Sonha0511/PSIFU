const crypto = require('node:crypto');

function validNewPassword(value) {
  return typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value, 'utf8') <= 72;
}

async function matchesPassword(input, stored, bcrypt) {
  if (typeof input !== 'string' || typeof stored !== 'string') return false;
  if (/^\$2[aby]\$/.test(stored)) return bcrypt.compare(input, stored).catch(() => false);
  // Compatibility for legacy plaintext records only; never accept a hash as a password.
  const a = Buffer.from(input), b = Buffer.from(stored);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function changePassword({ User, bcrypt, userId, currentPassword, newPassword, rounds = 10 }) {
  const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
  if (!validNewPassword(newPassword)) fail(400, 'Mật khẩu mới cần ít nhất 8 ký tự, tối đa 72 byte.');
  const user = await User.findById(userId);
  if (!user || !await matchesPassword(currentPassword, user.password, bcrypt)) fail(400, 'Mật khẩu hiện tại chưa chính xác.');
  if (await matchesPassword(newPassword, user.password, bcrypt)) fail(400, 'Mật khẩu mới phải khác mật khẩu hiện tại.');
  const password = await bcrypt.hash(newPassword, rounds);
  const updated = await User.findOneAndUpdate({
    _id: user._id,
    password: user.password,
    $expr: { $eq: [{ $ifNull: ['$sessionVersion', 0] }, user.sessionVersion || 0] },
  }, {
    $set: { password },
    $inc: { sessionVersion: 1 },
    $unset: { otpHash: '', otpPurpose: '', otpExpiresAt: '' },
  }, { new: true });
  if (!updated) fail(409, 'Tài khoản vừa được cập nhật. Vui lòng đăng nhập lại trước khi đổi mật khẩu.');
  return updated;
}

module.exports = { validNewPassword, matchesPassword, changePassword };
