const STATUS = Object.freeze({ pending: 'Chờ mentor xác nhận', confirmed: 'Đã xác nhận', completed: 'Đã hoàn thành', cancelled: 'Đã hủy' });

function canTransition(from, to, role) {
  if (!['mentee', 'mentor', 'admin'].includes(role)) return false;
  if (role === 'mentee' && to !== STATUS.cancelled) return false;
  if (from === STATUS.pending) return [STATUS.confirmed, STATUS.cancelled].includes(to);
  if (from === STATUS.confirmed) return [STATUS.completed, STATUS.cancelled].includes(to);
  return false;
}

function legacyRoom(booking) {
  // Express decodes route parameters before the original chat handler stores them.
  return `mentor-chat-${booking.mentorEmail}-${booking.menteeName}`;
}

function isParticipant(booking, auth) {
  return auth.role === 'admin' || booking.mentorEmail === auth.email || booking.menteeEmail === auth.email;
}

module.exports = { STATUS, canTransition, legacyRoom, isParticipant };
