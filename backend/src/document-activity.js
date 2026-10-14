function activityUpdate(body, canRead) {
  const update = {};
  const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
  if (body.saved !== undefined) {
    if (typeof body.saved !== 'boolean') fail(400, 'Trạng thái lưu tài liệu không hợp lệ.');
    update.saved = body.saved;
  }
  if (body.status !== undefined) {
    if (!canRead) fail(403, 'Hãy mở khóa tài liệu trước khi cập nhật trạng thái đọc.');
    if (!['unread', 'reading', 'completed'].includes(body.status)) fail(400, 'Trạng thái đọc không hợp lệ.');
    update.status = body.status;
    if (body.status === 'reading') update.lastOpenedAt = new Date();
  }
  if (body.rating !== undefined) {
    if (!canRead) fail(403, 'Hãy mở khóa tài liệu trước khi đánh giá.');
    if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) fail(400, 'Đánh giá phải từ 1 đến 5 sao.');
    update.rating = body.rating;
  }
  if (!Object.keys(update).length) fail(400, 'Không có thay đổi hợp lệ.');
  return update;
}
module.exports = { activityUpdate };
