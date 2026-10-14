const CHANNELS = ['announcements','general','mentoring-tips','course-discussion','resources','documents'];
function mentorChannel(room) {
  if (!String(room).startsWith('mentor-community::')) return null;
  return CHANNELS.includes(room.slice('mentor-community::'.length));
}
function canAccessMentorChannel(room, role, write = false) {
  return mentorChannel(room) === true && ['mentor','admin'].includes(role) && (!write || room !== 'mentor-community::announcements' || role === 'admin');
}
module.exports = { mentorChannel, canAccessMentorChannel };
