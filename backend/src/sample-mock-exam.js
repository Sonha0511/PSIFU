const base = [
  ['Big-O mô tả điều gì?', ['Tốc độ tăng tài nguyên theo kích thước đầu vào','Số dòng mã nguồn','Giá trị lớn nhất của input','Thời gian chạy tính bằng giây'], 0, 'Big-O mô tả tốc độ tăng của thời gian hoặc bộ nhớ khi kích thước input tăng.'],
  ['Truy cập phần tử a[i] trong mảng có độ phức tạp nào?', ['O(1)','O(log n)','O(n)','O(n²)'], 0, 'Mảng hỗ trợ truy cập ngẫu nhiên theo chỉ số trong O(1).'],
  ['Tìm phần tử thứ i trong singly linked list có worst-case nào?', ['O(1)','O(log n)','O(n)','O(n log n)'], 2, 'Linked list phải duyệt tuần tự từ head.'],
  ['Stack tuân theo nguyên tắc nào?', ['FIFO','LIFO','Ưu tiên nhỏ nhất','Ngẫu nhiên'], 1, 'Stack là Last In, First Out.'],
  ['Queue tuân theo nguyên tắc nào?', ['LIFO','FIFO','Chia để trị','Đệ quy'], 1, 'Queue là First In, First Out.'],
  ['Cấu trúc phù hợp nhất để cài Undo là gì?', ['Queue','Stack','Heap','Graph'], 1, 'Undo cần lấy thao tác mới nhất trước.'],
  ['BFS sử dụng cấu trúc hỗ trợ chính nào?', ['Stack','Queue','BST','Hash table'], 1, 'Queue giúp BFS khám phá vertex theo từng lớp.'],
  ['DFS có thể được cài đặt bằng gì?', ['Queue bắt buộc','Stack hoặc recursion','Heap bắt buộc','Chỉ adjacency matrix'], 1, 'Recursion dùng call stack; phiên bản lặp dùng stack tường minh.'],
  ['Binary search yêu cầu điều kiện nào?', ['Dữ liệu đã sắp xếp hoặc miền đơn điệu','Không có phần tử trùng','Chỉ gồm số nguyên','Kích thước là số chẵn'], 0, 'Binary search cần loại bỏ được một nửa miền tìm kiếm mỗi bước.'],
  ['Độ phức tạp của binary search là gì?', ['O(1)','O(log n)','O(n)','O(n²)'], 1, 'Mỗi bước giảm một nửa không gian tìm kiếm.'],
  ['Traversal nào của BST cho key theo thứ tự tăng dần?', ['Preorder','Inorder','Postorder','Level-order'], 1, 'Inorder đi Left - Root - Right.'],
  ['Search trong BST lệch hoàn toàn có worst-case nào?', ['O(1)','O(log n)','O(n)','O(n log n)'], 2, 'BST lệch có chiều cao n.'],
  ['Build-heap bottom-up từ n phần tử có độ phức tạp nào?', ['O(log n)','O(n)','O(n log n)','O(n²)'], 1, 'Tổng chi phí sift-down khi build heap là O(n).'],
  ['Extract-min trong binary min-heap có độ phức tạp nào?', ['O(1)','O(log n)','O(n)','O(n²)'], 1, 'Sau khi thay root cần sift-down theo chiều cao heap.'],
  ['Load factor của hash table được tính thế nào?', ['Số bucket / số key','Số key / số bucket','Chiều cao / số key','Số edge / số vertex'], 1, 'Load factor alpha bằng số phần tử chia số bucket.'],
  ['Kỹ thuật collision nào lưu một collection tại mỗi bucket?', ['Separate chaining','Linear probing','Binary search','Heapify'], 0, 'Separate chaining lưu list hoặc cấu trúc tương tự tại bucket.'],
  ['Thuật toán nào stable và có worst-case O(n log n)?', ['Selection sort','Quicksort chuẩn','Merge sort','Heap sort'], 2, 'Merge sort ổn định và luôn O(n log n).'],
  ['Insertion sort phù hợp nhất với dữ liệu nào?', ['Nhỏ hoặc gần sắp xếp','Graph dày','Cạnh âm','Hash table đầy'], 0, 'Insertion sort hiệu quả khi số phần tử nhỏ hoặc ít nghịch thế.'],
  ['Trong graph không trọng số, thuật toán nào tìm đường ít cạnh nhất?', ['DFS','BFS','Kruskal','Selection sort'], 1, 'BFS khám phá theo lớp nên tìm đường ít edge nhất.'],
  ['Dijkstra hoạt động đúng khi trọng số cạnh thế nào?', ['Có thể âm tùy ý','Không âm','Bắt buộc bằng nhau','Chỉ là số nguyên tố'], 1, 'Cạnh âm phá vỡ lựa chọn tham lam của Dijkstra.'],
];

function sampleMockExam(document, difficulty) {
  if (String(document.course || '').toUpperCase() !== 'CSD201') return null;
  return base.map(([question, options, answerIndex, explanation]) => ({
    question: difficulty === 'hard' ? `[Phân tích] ${question}` : difficulty === 'easy' ? `[Nền tảng] ${question}` : question,
    options,
    answerIndex,
    explanation,
  }));
}

module.exports = { sampleMockExam };
