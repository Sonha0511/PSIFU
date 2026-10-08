import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Alert, TextInput, Modal, Dimensions, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { fptData } from './data/fptData';
import { Database } from './data/database';
import Header from './components/Header';
import Gamification from './components/Gamification';
import Community from './components/Community'; 
import AdminDashboard from './components/AdminDashboard';
import MentorDashboard from './components/MentorDashboard';
import MentorHub from './components/MentorHub';
import MentorCommunity from './components/MentorCommunity';
import MentorDocuments from './components/MentorDocuments';
import MentorProfileHub from './components/MentorProfileHub';
import HomeDashboard from './components/HomeDashboard';
import FindMentor from './components/FindMentor';
import DocumentDetail from './components/DocumentDetail';
import DocumentReader from './components/DocumentReader';
import MyDocuments from './components/MyDocuments';
import MyCourses from './components/MyCourses';
import Notifications from './components/Notifications';
import QuizScreen from './components/QuizScreen';
import ProfileHub from './components/ProfileHub';
import MentorInbox from './components/MentorInbox';
import BookingHub from './components/BookingHub';
import ToastNotice from './components/ToastNotice';
import PayOSPayment from './components/PayOSPayment';
import AppointmentFlow from './components/AppointmentFlow';
import TopUpScreen from './components/TopUpScreen';

import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import ProfileSetup from './pages/ProfileSetup';
import Onboarding from './pages/Onboarding';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const BOOKING_TIME_SLOTS = ['09:00', '10:00', '14:00', '15:00', '19:00'];
const getAvailableDates = () => Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
});
const getAvailableTimeSlots = (date, occupiedTimes = [], openedSlots = []) => {
  const now = new Date();
  const [day, month, year] = date.split('/').map(Number);
  const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return openedSlots.filter(time => {
    const startTime = time.split(' ')[0];
    if (occupiedTimes.includes(startTime)) return false;
    const [hours, minutes] = startTime.split(':').map(Number);
    return !isToday || hours * 60 + minutes > currentMinutes;
  });
};
const ALL_TERMS = ['Kỳ 1', 'Kỳ 2', 'Kỳ 3', 'Kỳ 4', 'Kỳ 5', 'Kỳ 6', 'Kỳ 7','Kỳ 8', 'Kỳ 9'];

export default function App() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('mentee');
  const [currentUser, setCurrentUser] = useState(null);
  const [mentorProfiles, setMentorProfiles] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [mentorDocuments, setMentorDocuments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedLearningDoc, setSelectedLearningDoc] = useState(null);
  const [selectedDocumentDetail, setSelectedDocumentDetail] = useState(null);
  const [selectedDocumentReader, setSelectedDocumentReader] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [selectedQuizDocument, setSelectedQuizDocument] = useState(null);
  const [documentRatings, setDocumentRatings] = useState({});
  const [documentSearch, setDocumentSearch] = useState('');
  const [notice, setNotice] = useState(null);
  const [authScreen, setAuthScreen] = useState('login'); 
  const [email, setEmail] = useState('');
  const [loginPrefillEmail, setLoginPrefillEmail] = useState('');
  const [resetOtpCode, setResetOtpCode] = useState('');
  
  // Điều khiển Popup Modal
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [occupiedBookingTimes, setOccupiedBookingTimes] = useState([]);
  const [bookingNote, setBookingNote] = useState('');
  const [selectedMentorSlots, setSelectedMentorSlots] = useState([]);
  const [selectedBookingCourse, setSelectedBookingCourse] = useState('');
  const [selectedMentorFee, setSelectedMentorFee] = useState(50);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(100);
  const [showPayOSPayment, setShowPayOSPayment] = useState(false);
  const [topUpStandalone, setTopUpStandalone] = useState(false);

  // Cấu hình giao diện Sáng / Tối (Dark Mode)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Thông tin User
  const [university, setUniversity] = useState('');
  const [academicYear, setAcademicYear] = useState('Năm 1');
  const [fptK, setFptK] = useState(''); 
  const [lastCommunityTerm, setLastCommunityTerm] = useState('');
  const [shouldShowCommunityFilter, setShouldShowCommunityFilter] = useState(false);
  const [currentTerm, setCurrentTerm] = useState('Kỳ 1');
  const [major, setMajor] = useState('Computing');
  const [specialization, setSpecialization] = useState('SE');
  const [track, setTrack] = useState('JS');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userXu, setUserXu] = useState(20);
  const [isPremium, setIsPremium] = useState(false); 

  const [unlockedDocs, setUnlockedDocs] = useState({});
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  // Thứ tự mặc định ban đầu hiển thị tab Community đầu tiên
  const [currentTab, setCurrentTab] = useState('home'); 
  const [activeFilterTerm, setActiveFilterTerm] = useState('Kỳ 1'); 

  useEffect(() => {
    AsyncStorage.getItem('@psifu_has_seen_onboarding').then(value => setHasSeenOnboarding(value === 'true'));
  }, []);

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('@psifu_has_seen_onboarding', 'true');
    setHasSeenOnboarding(true);
  };

  // Dữ liệu mẫu Banner trượt ngang
  const bannerData = [
    { id: 'b1', title: '🚀 Bí kíp qua môn siêu tốc', desc: 'Chia sẻ từ Thủ khoa khóa trước', bg: '#0284c7' },
    { id: 'b2', title: '🔥 Đợt tuyển Mentor Tháng 7', desc: 'Đăng ký ngay để nhận đặc quyền VIP', bg: '#7c3aed' },
    { id: 'b3', title: '💎 Gói Premium PSIFU', desc: 'Mở khóa toàn bộ kho tài liệu Mentor', bg: '#b45309' },
  ];

  // Dữ liệu mẫu danh sách Mentor
  const mentorData = [
    { id: 'm1', name: 'Anh Trần Hải Nam', role: 'Software Engineer @ VinGroup', avatar: '👨‍💻', bio: 'Kinh nghiệm 4 năm chinh chiến OJT và làm đồ án tốt nghiệp xuất sắc ngành SE.', post: 'Kinh nghiệm săn học bổng doanh nghiệp và cách viết CV chuẩn chỉ cho sinh viên IT từ năm 2.' },
    { id: 'm2', name: 'Chị Nguyễn Minh Thư', role: 'Data Analyst @ McKinsey', avatar: '👩‍💼', bio: 'Cựu sinh viên xuất sắc chuyên ngành Kinh doanh quốc tế, chuyên trị các môn Thống kê.', post: 'Lộ trình tự học SQL và Python từ con số 0 cho mọi khối ngành để đi thực tập sớm.' }
  ];

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setUserRole(user.role || 'mentee');
    Database.getMentors().then(users => setMentorProfiles(users.map((item, index) => ({ id: item.email, name: item.fullName, role: item.specialty || 'Mentor PSIFU', avatar: '👨‍🏫', bio: `Mentor chuyên môn ${item.specialty || 'đa ngành'}.`, post: 'Sẵn sàng hỗ trợ mentee.', courses: item.email === 'mentor.se@psifu.vn' ? ['PRF192', 'PRO192', 'CSD201', 'DBI202', 'SDN302'] : item.email === 'mentor.data@psifu.vn' ? ['MAE101', 'MAD101', 'DBI202'] : ['MKT101'], availableSlots: index === 2 ? [] : index === 1 ? ['09:00 - 10:00', '19:00 - 20:00'] : ['09:00 - 10:00', '14:00 - 15:00', '19:00 - 20:00'], fee: index === 1 ? 40 : 50 }))));
    Database.getBookings().then(bookings => setMyBookings(user.role === 'mentor' ? bookings.filter(item => item.mentorEmail === user.email) : bookings.filter(item => item.menteeName === user.fullName)));
    (user.role === 'mentor' ? Database.getMentorDocuments(user.email) : Database.getPublishedMentorDocuments()).then(setMentorDocuments).catch(() => setMentorDocuments([]));
    Database.getDocumentUnlocks(user.email).then(ids => setUnlockedDocs(Object.fromEntries(ids.map(id => [id, true])))).catch(() => setUnlockedDocs({}));
    setEmail(user.email);
    setFullName(user.fullName);
    setAvatarUrl(user.avatarUrl || '');
    setUserXu(user.userXu);
    Database.getSubscription(user.email).then(subscription => setIsPremium(!!subscription.isPremium)).catch(() => setIsPremium(false));
    setHasCheckedInToday(user.hasCheckedInToday);
    
    if (!user.university || user.isFirstLogin) {
      setUniversity('');
      setAcademicYear('Năm 1');
      setFptK('');
      setCurrentTerm('Kỳ 1');
      setShowOnboarding(true); 
    } else {
      setUniversity(user.university);
      setAcademicYear(user.academicYear);
      setFptK(user.fptK);
      setCurrentTerm(user.currentTerm);
      setMajor(user.major || 'Computing');
      setSpecialization(user.specialization || 'SE');
      setTrack(user.track || (user.specialization === 'SE' ? 'JS' : ''));
      setActiveFilterTerm(user.currentTerm);
      setLastCommunityTerm(user.currentTerm);
      Database.getCourses(user.currentTerm, user.major || 'Computing', user.specialization || 'SE', user.track || (user.specialization === 'SE' ? 'JS' : '')).then(setCourses).catch(() => setCourses([]));
    }
    setIsLoggedIn(true);
  };

  const handleLogout = async () => { await Database.logout(); setCurrentUser(null); setIsLoggedIn(false); };

  const handleCompleteOnboarding = async (details = {}) => {
    const nextUniversity = details.university ?? university;
    const nextTerm = details.currentTerm ?? currentTerm;
    if (!nextUniversity.trim() || !nextTerm) return Alert.alert('Thông báo', 'Vui lòng điền Trường đại học và Học kỳ hiện tại!');
    const saved = await Database.updateUserData(email, {
      university: nextUniversity.trim(), academicYear: details.academicYear ?? academicYear, fptK: details.fptK ?? fptK, studentId: details.studentId ?? '', major: details.major ?? 'Computing', specialization: details.specialization ?? 'SE', track: details.track ?? '', currentTerm: nextTerm, isFirstLogin: false
    });

    if (!saved) {
      Alert.alert('Lỗi lưu thông tin', 'Không thể lưu hồ sơ lúc này. Vui lòng thử lại.');
      return;
    }

    const nextMajor = details.major ?? major;
    const nextSpecialization = details.specialization ?? specialization;
    const nextTrack = details.track ?? track;
    setUniversity(nextUniversity.trim()); setAcademicYear(details.academicYear ?? academicYear); setFptK(details.fptK ?? fptK); setCurrentTerm(nextTerm); setMajor(nextMajor); setSpecialization(nextSpecialization); setTrack(nextTrack);
    setActiveFilterTerm(nextTerm); setLastCommunityTerm(nextTerm);
    Database.getCourses(nextTerm, nextMajor, nextSpecialization, nextTrack).then(setCourses).catch(() => setCourses([]));
    setShouldShowCommunityFilter(true);
    setShowOnboarding(false);
  };

  const handleUpdateXu = async (amount) => {
    const nextXu = userXu + amount;
    setUserXu(nextXu);
    await Database.updateUserData(email, { userXu: nextXu });
  };

  const handleCheckInSuccess = async () => {
    setUserXu(prev => prev + 1);
    setHasCheckedInToday(true);
    await Database.updateUserData(email, { userXu: userXu + 1, hasCheckedInToday: true });
  };

  const handleSaveProfile = async () => {
    const success = await Database.updateUserData(email, { fullName, avatarUrl, university, academicYear, fptK, major, specialization, track, currentTerm });
    if (success) {
      setCurrentUser(previous => ({ ...previous, fullName, avatarUrl, university, academicYear, fptK, major, specialization, track, currentTerm }));
      setActiveFilterTerm(currentTerm);
      Database.getCourses(currentTerm, major, specialization, track).then(setCourses).catch(() => setCourses([]));
      if (currentTerm !== lastCommunityTerm) {
        setLastCommunityTerm(currentTerm);
        setShouldShowCommunityFilter(true);
      }
      setShowEditProfileModal(false);
      Alert.alert('Thành công 🎉', 'Đã lưu và cập nhật lộ trình học tập mới!');
    }
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Cần quyền truy cập ảnh', 'Hãy cho phép PSIFU truy cập thư viện ảnh để đổi ảnh đại diện.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.65 });
    if (!result.canceled) setAvatarUrl(result.assets[0].uri);
  };

  const handleUnlockDoc = async (doc) => {
    const docId = doc.id || doc.code; const fee = Number(doc.fee || 0);
    if (unlockedDocs[docId]) return;
    if (userXu < fee) {
      setNotice({ type: 'error', title: 'Chưa đủ Xu', message: `Bạn cần thêm ${fee - userXu} Xu để mở tài liệu này.` });
      Alert.alert('Thiếu Xu 🛑', 'Bạn không đủ Xu để mở tài liệu này!');
      return;
    }
    if (!doc.mentorEmail) { await handleUpdateXu(-fee); setUnlockedDocs(prev => ({ ...prev, [docId]: true })); setNotice({ title: 'Đã mở khóa tài liệu', message: 'Tài liệu đã sẵn sàng trong mục Tài liệu của tôi.' }); return; }
    try { const result = await Database.unlockMentorDocument(docId, email); setUserXu(result.userXu); setCurrentUser(previous => ({ ...previous, userXu:result.userXu })); setUnlockedDocs(prev => ({ ...prev, [docId]: true })); setNotice({ title:'Đã mở khóa tài liệu', message:'Quyền đọc đã được lưu vào tài khoản của bạn.' }); }
    catch(error) { Alert.alert('Không thể mở khóa', error?.data?.msg || 'Vui lòng thử lại.'); }
  };
  const openDocumentReader = async doc => { try { if (!doc.mentorEmail) return setSelectedDocumentReader(doc); const result = await Database.getMentorDocumentAccess(doc.id, email); setSelectedDocumentReader(result.document); } catch(error) { Alert.alert('Không thể mở tài liệu', error?.data?.msg || 'Vui lòng thử lại.'); } };

  const handleRateDocument = (docId, rating) => {
    setDocumentRatings(prev => ({ ...prev, [docId]: rating }));
    Alert.alert('Cảm ơn bạn!', `Bạn đã đánh giá ${rating}/5 sao cho tài liệu này.`);
    setNotice({ title: 'Cảm ơn đánh giá của bạn', message: `Bạn đã chấm ${rating}/5 sao cho tài liệu.` });
  };
  const handleUpdateBooking = async (bookingId, status) => {
    const success = await Database.updateBookingStatus(bookingId, status);
    if (success) {
      const bookings = await Database.getBookings();
      setMyBookings(bookings.filter(item => item.menteeName === fullName));
    }
    return success;
  };

  const openAiQuiz = async (doc) => {
    try { await Database.requestQuizAccess(email); setSelectedQuizDocument(doc); }
    catch (error) { const code=error?.data?.code; Alert.alert(code === 'PREMIUM_REQUIRED' ? 'Đã dùng hết lượt Quiz Free' : 'Đã đạt giới hạn Quiz', code === 'PREMIUM_REQUIRED' ? 'Nâng cấp Premium để có nhiều lượt AI Quiz và phân tích chi tiết hơn.' : 'Bạn đã dùng hết lượt Quiz trong kỳ này.'); }
  };

  const handleBuyPremium = () => {
    Alert.alert(
      'Xác nhận đăng ký Premium 💎',
      'Premium mở thư viện học liệu Premium, nhiều lượt AI Quiz hơn và phân tích kết quả. Tài liệu Marketplace của mentor vẫn dùng Xu riêng.',
      [
        { text: 'Hủy' },
        { text: 'Nâng cấp ngay', onPress: async () => {
            const result = await Database.activatePremiumMock(email);
            if (result.success) { setIsPremium(true); setCurrentUser(previous => ({ ...previous, subscription: result.subscription })); Alert.alert('Chúc mừng ✨', 'PSIFU Premium đã được kích hoạt trong môi trường demo.'); }
          }
        }
      ]
    );
  };

  const triggerBooking = async (mentor, course = '') => {
    const today = new Date();
    const defaultDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    const bookings = await Database.getBookings();
    setSelectedMentor(mentor.name);
    setSelectedMentorId(mentor.id);
    setSelectedMentorSlots(mentor.availableSlots || []);
    setSelectedBookingCourse(course);
    setSelectedMentorFee(mentor.fee || 50);
    setTopUpStandalone(false);
    setBookingDate(defaultDate);
    setBookingTime('');
    setOccupiedBookingTimes(bookings.filter(item => item.mentorEmail === mentor.id && item.dateTime.startsWith(defaultDate)).map(item => item.dateTime.split(' ')[1]));
    setBookingNote('');
    setShowBookingModal(true);
  };

  const submitBooking = async (details = {}) => {
    const finalDate = details.date || bookingDate; const finalTime = details.time || bookingTime; const finalNote = details.note || bookingNote;
    if (!finalDate || !finalTime || !finalNote.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập ngày giờ và nội dung cần tư vấn.');
      return false;
    }
    if (userXu < selectedMentorFee) {
      setShowBookingModal(false);
      setShowTopUpModal(true);
      return false;
    }
    const bookingResult = await Database.saveBooking({
      mentorEmail: selectedMentorId,
      mentorName: selectedMentor,
      menteeName: fullName,
      dateTime: `${finalDate} ${finalTime}`,
      course: selectedBookingCourse,
      note: finalNote.trim()
    });
    if (bookingResult && bookingResult.success === false) {
      Alert.alert('Khung giờ không khả dụng', bookingResult.msg);
      return false;
    }
    setShowBookingModal(false);
    setUserXu(current => current - selectedMentorFee);
    await Database.updateUserData(email, { userXu: userXu - selectedMentorFee });
    const updatedBookings = await Database.getBookings();
    setMyBookings(updatedBookings.filter(item => item.menteeName === fullName));
    Alert.alert('Đăng ký thành công', 'Yêu cầu đã gửi đến Mentor và sẽ xuất hiện trên lịch của Mentor.');
    setNotice({ title: 'Đã gửi lịch hẹn', message: 'Mentor sẽ xem và xác nhận lịch hẹn của bạn.' });
    return true;
  };

  const selectBookingDate = async (date) => {
    const bookings = await Database.getBookings();
    setBookingDate(date);
    setBookingTime('');
    setOccupiedBookingTimes(bookings.filter(item => item.mentorEmail === selectedMentorId && item.dateTime.startsWith(date)).map(item => item.dateTime.split(' ')[1]));
  };

  const themeContainer = isDarkMode ? styles.darkContainer : styles.lightContainer;
  const themeText = isDarkMode ? styles.darkText : styles.lightText;
  const themeCard = isDarkMode ? styles.darkCard : styles.lightCard;

  if (hasSeenOnboarding === null) return <SafeAreaView style={{ flex: 1, backgroundColor: '#075ab5' }} />;

  if (!hasSeenOnboarding) return <Onboarding onFinish={finishOnboarding} />;

  if (!isLoggedIn) {
    if (authScreen === 'login') {
      return <Login onLoginSuccess={handleLoginSuccess} prefilledEmail={loginPrefillEmail} onSwitchToRegister={() => setAuthScreen('register')} onForgotPassword={() => setAuthScreen('forgot')} />;
    }
    if (authScreen === 'forgot') {
      return <ForgotPassword onBack={() => setAuthScreen('login')} onCodeSent={(resetEmail) => { setLoginPrefillEmail(resetEmail); setAuthScreen('resetVerify'); }} />;
    }
    if (authScreen === 'resetVerify') {
      return <VerifyEmail email={loginPrefillEmail} purpose="password-reset" autoSend={false} onBack={() => setAuthScreen('forgot')} onVerified={(resetEmail, code) => { setLoginPrefillEmail(resetEmail); setResetOtpCode(code); setAuthScreen('resetPassword'); }} />;
    }
    if (authScreen === 'resetPassword') {
      return <ResetPassword email={loginPrefillEmail} otpCode={resetOtpCode} onBack={() => setAuthScreen('resetVerify')} onComplete={(resetEmail) => { setLoginPrefillEmail(resetEmail); setResetOtpCode(''); setAuthScreen('login'); }} />;
    } else {
      if (authScreen === 'registerVerify') return <VerifyEmail email={loginPrefillEmail} onBack={() => setAuthScreen('register')} onVerified={(verifiedEmail) => { setLoginPrefillEmail(verifiedEmail); setAuthScreen('login'); }} />;
      return <Register onSwitchToLogin={() => setAuthScreen('login')} onRegisterSuccess={(registeredEmail) => { setLoginPrefillEmail(registeredEmail); setAuthScreen('registerVerify'); }} />;
    }
  }

  if (userRole === 'admin') {
    return <SafeAreaView style={[styles.container, styles.lightContainer]}><AdminDashboard admin={currentUser} onLogout={handleLogout} /></SafeAreaView>;
  }

  if (showOnboarding) return <ProfileSetup onComplete={handleCompleteOnboarding} />;

  if (showChangePassword) return <SafeAreaView style={[styles.container, styles.lightContainer]}><ChangePassword email={email} onBack={() => setShowChangePassword(false)} /></SafeAreaView>;
  if (showNotifications) return <SafeAreaView style={[styles.container, styles.lightContainer]}><Notifications email={email} onBack={() => setShowNotifications(false)} /></SafeAreaView>;

  if (selectedQuizDocument) return <SafeAreaView style={[styles.container, styles.lightContainer]}><QuizScreen document={selectedQuizDocument} onBack={() => setSelectedQuizDocument(null)} onComplete={() => setSelectedQuizDocument(null)} /><ToastNotice notice={notice} onClose={() => setNotice(null)} /></SafeAreaView>;

  if (selectedDocumentReader) return <SafeAreaView style={[styles.container, styles.lightContainer]}><DocumentReader document={selectedDocumentReader} onBack={() => setSelectedDocumentReader(null)} onQuiz={() => openAiQuiz(selectedDocumentReader)} /><ToastNotice notice={notice} onClose={() => setNotice(null)} /></SafeAreaView>;
  if (selectedDocumentDetail) return <SafeAreaView style={[styles.container, styles.lightContainer]}><DocumentDetail document={selectedDocumentDetail} unlocked={!!unlockedDocs[selectedDocumentDetail.id] || Number(selectedDocumentDetail.fee || 0) === 0} rating={documentRatings[selectedDocumentDetail.id] || 0} onBack={() => setSelectedDocumentDetail(null)} onUnlock={() => handleUnlockDoc(selectedDocumentDetail)} onRead={() => openDocumentReader(selectedDocumentDetail)} onQuiz={() => openAiQuiz(selectedDocumentDetail)} onRate={(rating) => handleRateDocument(selectedDocumentDetail.id, rating)} /><ToastNotice notice={notice} onClose={() => setNotice(null)} /></SafeAreaView>;
  if (showTopUpModal) return <SafeAreaView style={[styles.container, styles.lightContainer]}><TopUpScreen balance={userXu} amount={topUpAmount} requiredFee={topUpStandalone ? 0 : selectedMentorFee} onChangeAmount={setTopUpAmount} onClose={() => { setShowTopUpModal(false); if (!topUpStandalone) setShowBookingModal(true); }} onContinue={() => setShowPayOSPayment(true)} /></SafeAreaView>;
  if (showPayOSPayment) return <SafeAreaView style={[styles.container, styles.lightContainer]}><PayOSPayment coins={topUpAmount} email={email} onCancel={() => setShowPayOSPayment(false)} onPaid={(payment) => { setUserXu(payment.userXu); setCurrentUser(previous => ({...previous,userXu:payment.userXu})); setShowPayOSPayment(false); setShowTopUpModal(false); if(!topUpStandalone)setShowBookingModal(true); setNotice({title:'Nạp Xu thành công',message:`PayOS đã xác nhận và cộng ${payment.coins} Xu vào ví PSIFU.`}); }} /></SafeAreaView>;
  if (showBookingModal) return <SafeAreaView style={[styles.container, styles.lightContainer]}><AppointmentFlow mentor={selectedMentor} course={selectedBookingCourse} fee={selectedMentorFee} slots={selectedMentorSlots} onCancel={() => setShowBookingModal(false)} onSubmit={submitBooking} /></SafeAreaView>;

  return (
    <SafeAreaView style={[styles.container, themeContainer]}>
      {!['home', 'community', 'chat', 'schedule', 'docs'].includes(currentTab) && <Header studentName={fullName} userXu={userXu} />}
      
      {/* POPUP ONBOARDING LẦN ĐẦU ĐĂNG NHẬP */}
      <Modal visible={showOnboarding} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cá Nhân Hóa Trải Nghiệm 🎓</Text>
            <Text style={styles.modalSub}>Điền thông tin học tập của bạn để tối ưu hóa lộ trình tài liệu chuẩn nhất.</Text>
            <Text style={styles.popupLabel}>Tên Trường Đại Học</Text>
            <TextInput style={styles.popupInput} placeholder="Ví dụ: Bách Khoa, Kinh Tế, FPT..." value={university} onChangeText={setUniversity} />
            <Text style={styles.popupLabel}>Năm Học Hiện Tại</Text>
            <TextInput style={styles.popupInput} placeholder="Ví dụ: Năm 1, Năm 2..." value={academicYear} onChangeText={setAcademicYear} />
            <Text style={styles.popupLabel}>Học Kỳ Hiện Tại (Cộng đồng)</Text>
            <TextInput style={styles.popupInput} placeholder="Ví dụ: Kỳ 1, Kỳ 4..." value={currentTerm} onChangeText={setCurrentTerm} />
            {university.toLowerCase().includes('fpt') && (
              <View style={{width: '100%'}}>
                <Text style={styles.popupLabel}>Khóa học (Dành riêng FPT)</Text>
                <TextInput style={styles.popupInput} placeholder="Ví dụ: K19" value={fptK} onChangeText={setFptK} />
              </View>
            )}
            <TouchableOpacity style={styles.btnPopupSubmit} onPress={handleCompleteOnboarding}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>BẮT ĐẦU TRẢI NGHIỆM</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* POPUP ĐẶT LỊCH HẸN MENTOR 1-1 */}
      <Modal visible={showBookingModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowBookingModal(false)} accessibilityLabel="Đóng đặt lịch">
              <Text style={styles.closeModalText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>📅 Đặt Lịch Hẹn 1-1</Text>
            <Text style={styles.modalSub}>Kết nối trực tiếp cá nhân với: <Text style={{fontWeight: 'bold', color: '#0284c7'}}>{selectedMentor}</Text></Text>
            <Text style={styles.popupLabel}>Chọn ngày</Text>
            <ScrollView style={styles.bookingScroll} contentContainerStyle={styles.bookingScrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.bookingOptions}>
              {getAvailableDates().map(date => <TouchableOpacity key={date} onPress={() => selectBookingDate(date)} style={[styles.bookingOption, bookingDate === date && styles.bookingOptionActive]}><Text style={[styles.bookingOptionText, bookingDate === date && styles.bookingOptionTextActive]}>{date}</Text></TouchableOpacity>)}
            </View>
            <Text style={styles.popupLabel}>Chọn giờ còn trống</Text>
            <View style={styles.bookingOptions}>
              {getAvailableTimeSlots(bookingDate, occupiedBookingTimes, selectedMentorSlots).map(time => <TouchableOpacity key={time} onPress={() => setBookingTime(time)} style={[styles.bookingOption, bookingTime === time && styles.bookingOptionActive]}><Text style={[styles.bookingOptionText, bookingTime === time && styles.bookingOptionTextActive]}>{time}</Text></TouchableOpacity>)}
              {!getAvailableTimeSlots(bookingDate, occupiedBookingTimes, selectedMentorSlots).length && <Text style={{ color: '#64748b', fontSize: 13, paddingVertical: 10 }}>Mentor chưa mở lịch trống vào ngày này. Hãy chọn ngày khác hoặc xem mentor khác.</Text>}
            </View>
            <TextInput style={[styles.popupInput, {height: 80, marginTop: 10}]} placeholder="Nội dung tư vấn" value={bookingNote} onChangeText={setBookingNote} multiline />
            <TouchableOpacity style={styles.btnPopupSubmit} onPress={submitBooking}><Text style={{color: '#fff', fontWeight: 'bold'}}>XÁC NHẬN KHUNG GIỜ</Text></TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={[styles.btnPopupSubmit, styles.bookingSubmitButton]} onPress={submitBooking}>
              <Text style={{color: '#fff', fontWeight: 'bold'}}>XÁC NHẬN ĐẶT LỊCH</Text>
            </TouchableOpacity>
            <View style={{display: 'none'}}>
              <TouchableOpacity style={[styles.btnPopupSubmit, {backgroundColor: '#64748b', flex: 0.45, marginTop: 0}]} onPress={() => setShowBookingModal(false)}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>HỦY</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnPopupSubmit, {flex: 0.45, marginTop: 0}]} onPress={() => { setShowBookingModal(false); Alert.alert('Đăng ký thành công', 'Yêu cầu của bạn đã gửi đến Mentor.'); }}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>GỬI LỊCH</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showTopUpModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.topUpCard}>
            <TouchableOpacity style={styles.closeModalButton} onPress={() => { setShowTopUpModal(false); if(!topUpStandalone)setShowBookingModal(true); }}><Text style={styles.closeModalText}>×</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Nạp PSIFU Xu</Text>
            <View style={styles.balanceCard}><Text style={styles.balanceLabel}>SỐ DƯ HIỆN TẠI</Text><Text style={styles.balanceValue}>🪙 {userXu} Xu</Text></View>
            <View style={styles.topUpNotice}><Text style={styles.topUpNoticeText}>Lịch hẹn này cần {selectedMentorFee} Xu. Bạn còn thiếu {Math.max(0, selectedMentorFee - userXu)} Xu.</Text></View>
            <Text style={styles.popupLabel}>Chọn gói Xu</Text>
            <View style={styles.packageGrid}>{[50, 100, 200, 500].map(amount => <TouchableOpacity key={amount} onPress={() => setTopUpAmount(amount)} style={[styles.packageCard, topUpAmount === amount && styles.packageActive]}><Text style={styles.packageCoin}>🪙 {amount} Xu</Text><Text style={styles.packageSub}>{amount >= selectedMentorFee - userXu ? 'Đủ cho lịch hẹn' : 'Nạp thêm để tiếp tục'}</Text></TouchableOpacity>)}</View>
            <View style={styles.paymentRow}><Ionicons name="qr-code-outline" size={23} color="#60A5FA" /><View><Text style={styles.paymentTitle}>PayOS</Text><Text style={styles.paymentSub}>Thanh toán QR bảo mật</Text></View><Text style={styles.selectedPayment}>Đã chọn</Text></View>
            <View style={styles.topUpSummary}><Text style={styles.summaryText}>Nạp thêm <Text style={styles.summaryStrong}>{topUpAmount} Xu</Text></Text><Text style={styles.summaryText}>Số dư sau nạp <Text style={styles.summaryGreen}>{userXu + topUpAmount} Xu</Text></Text></View>
            <TouchableOpacity style={styles.btnPopupSubmit} onPress={() => setShowPayOSPayment(true)}><Text style={{ color: '#fff', fontWeight: '800' }}>TIẾP TỤC VỚI PAYOS</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* POPUP CHỈNH SỬA THÔNG TIN PROFILE */}
      <Modal visible={showEditProfileModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>👤 Edit Profile</Text>
            <TouchableOpacity style={styles.avatarPicker} onPress={pickAvatar}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarPreview} /> : <View style={styles.avatarFallback}><Text style={styles.avatarFallbackText}>{(fullName || 'PS').split(' ').map(item => item[0]).slice(-2).join('')}</Text></View>}
              <View style={styles.avatarEditBadge}><Ionicons name="camera" size={14} color="#FFFFFF" /></View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Chạm để chọn ảnh đại diện</Text>
            <Text style={styles.popupLabel}>Họ và tên thành viên</Text>
            <TextInput style={styles.popupInput} value={fullName} onChangeText={setFullName} />
            <Text style={styles.popupLabel}>Trường đại học</Text>
            <TextInput style={styles.popupInput} value={university} onChangeText={setUniversity} />
            <Text style={styles.popupLabel}>Năm học hiện tại</Text>
            <TextInput style={styles.popupInput} value={academicYear} onChangeText={setAcademicYear} />
            <Text style={styles.popupLabel}>Học kỳ hiện tại</Text>
            <TextInput style={styles.popupInput} value={currentTerm} onChangeText={setCurrentTerm} />
            <View style={{flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginTop: 20}}>
              <TouchableOpacity style={[styles.btnPopupSubmit, {backgroundColor: '#64748b', flex: 0.45, marginTop: 0}]} onPress={() => setShowEditProfileModal(false)}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>ĐÓNG</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnPopupSubmit, {flex: 0.45, marginTop: 0}]} onPress={handleSaveProfile}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>LƯU LẠI</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* NỘI DUNG CHÍNH CỦA APP ĐIỀU PHỐI QUA TAB */}
      <View style={{ flex: 1 }}>
        {currentTab === 'home' && userRole !== 'mentor' && <HomeDashboard fullName={fullName} userEmail={email} userXu={userXu} hasCheckedInToday={hasCheckedInToday} currentTerm={currentTerm} mentors={mentorProfiles} bookings={myBookings} courses={courses} recentDocuments={mentorDocuments} onNotifications={() => setShowNotifications(true)} onNavigate={(tab) => { setCurrentTab(tab); if (tab === 'docs') setActiveFilterTerm(currentTerm); }} onBook={triggerBooking} />}
        {currentTab === 'home' && userRole === 'mentor' && <MentorHub mentor={currentUser} screen="home" onNavigate={(tab) => setCurrentTab(tab)} />}
        {currentTab === 'rewards' && <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} style={styles.lightContainer}><View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:8 }}><TouchableOpacity onPress={() => setCurrentTab('home')}><Ionicons name="arrow-back" size={22} color="#173F83" /></TouchableOpacity><Text style={{ color:'#14213D', fontSize:17, fontWeight:'900' }}>Daily Rewards</Text></View><Gamification userXu={userXu} onUpdateXu={handleUpdateXu} hasCheckedInToday={hasCheckedInToday} onCheckInSuccess={handleCheckInSuccess} /></ScrollView>}
        
        {/* 1. COMMUNITY (GỌI ĐẾN FILE LOGIC RIÊNG BIỆT) */}
        {currentTab === 'community' && userRole !== 'mentor' && (
          <Community 
            university={university}
            currentTerm={currentTerm}
            academicYear={academicYear}
            fullName={fullName}
            fptK={fptK}
            isDarkMode={isDarkMode}
            userXu={userXu}
            courses={courses}
            onUpdateXu={handleUpdateXu}
            currentUser={currentUser}
            mentors={mentorProfiles}
            bookings={myBookings}
            filterPopupRequested={shouldShowCommunityFilter}
            onFilterPopupHandled={() => setShouldShowCommunityFilter(false)}
          />
        )}

        {currentTab === 'mentor' && userRole === 'mentor' && <MentorHub mentor={currentUser} screen="sessions" onNavigate={(tab) => setCurrentTab(tab)} />}

        {/* 2. TÀI LIỆU */}
        {currentTab === 'community' && userRole === 'mentor' && <MentorCommunity mentor={currentUser} bookings={myBookings} onOpenChat={() => setCurrentTab('chat')} />}
        {currentTab === 'chat' && <MentorInbox mentors={mentorProfiles} bookings={myBookings} menteeName={fullName} />}
        {currentTab === 'schedule' && <BookingHub bookings={myBookings} onBack={() => setCurrentTab('home')} onUpdate={handleUpdateBooking} menteeName={fullName} />}
        {currentTab === 'courses' && <MyCourses courses={courses} currentTerm={currentTerm} onBack={() => setCurrentTab('home')} onOpenCourse={() => setCurrentTab('docs')} />}
        {currentTab === 'docs' && userRole === 'mentor' && <MentorDocuments mentor={currentUser} />}
        {currentTab === 'docs' && userRole !== 'mentor' && <MyDocuments documents={[...fptData, ...mentorDocuments].map(doc => ({ ...doc, id: doc.id || doc.code }))} unlockedDocs={unlockedDocs} onOpen={(doc) => setSelectedDocumentDetail(doc)} />}
        {false && currentTab === 'docs' && userRole !== 'mentor' && (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <View style={styles.docsHero}><View><Text style={styles.docsEyebrow}>LEARNING EXPLORER</Text><Text style={styles.docsTitle}>Tài liệu học tập</Text><Text style={styles.docsSubtitle}>Học theo môn, lưu tài liệu và làm quiz ôn tập.</Text></View><View style={styles.docsCoin}><Ionicons name="wallet-outline" size={16} color="#173F83" /><Text style={styles.docsCoinText}>{userXu} Xu</Text></View></View>
            <View style={styles.docsSearch}><Ionicons name="search-outline" size={18} color="#536E99" /><TextInput value={documentSearch} onChangeText={setDocumentSearch} placeholder="Tìm môn học hoặc tài liệu..." placeholderTextColor="#71829D" style={styles.docsSearchInput} /></View>

            <Text style={[styles.sectionTitle, themeText]}>Kho tài liệu chia sẻ từ cộng đồng</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {ALL_TERMS.map(term => (
                <TouchableOpacity key={term} style={[styles.tabFilterBtn, activeFilterTerm === term && styles.tabFilterBtnActive]} onPress={() => setActiveFilterTerm(term)}>
                  <Text style={[styles.tabFilterText, activeFilterTerm === term && styles.tabFilterTextActive]}>
                    {term} {currentTerm === term && '📌'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {mentorDocuments.filter(doc => doc.term === activeFilterTerm).map(doc => (
              <View key={doc.id} style={[styles.docCard, themeCard]}>
                <View style={styles.docHeader}><Text style={styles.docId}>Mentor · {doc.course}</Text><Text style={[styles.docPrice, themeText]}>Mới</Text></View>
                <Text style={[styles.docName, themeText]}>{doc.title}</Text>
                <Text style={styles.mentorDocumentMeta}>Cung cấp bởi Mentor {doc.mentorName} · {doc.specialty}</Text>
                <TouchableOpacity style={styles.docDetailsBtn} onPress={() => setSelectedDocumentDetail({ ...doc, id: doc.id, name: doc.title, fee: 0 })}><Text style={styles.docDetailsText}>Xem chi tiết tài liệu  ›</Text></TouchableOpacity>
                <View style={styles.unlockedBox}><Text style={styles.linkText}>📎 {doc.fileName}</Text></View>
              </View>
            ))}
            {(courses.length ? courses : fptData).filter(item => item.term === activeFilterTerm && `${item.code || item.id} ${item.name}`.toLowerCase().includes(documentSearch.trim().toLowerCase())).map(doc => (
              <View key={doc.code || doc.id} style={[styles.docCard, themeCard]}>
                <View style={styles.docHeader}><Text style={styles.docId}>{doc.code || doc.id}</Text><Text style={[styles.docPrice, themeText]}>{doc.fee} Xu</Text></View>
                <Text style={[styles.docName, themeText]}>{doc.name}</Text>
                <Text style={styles.documentProvider}>Cung cấp bởi: PSIFU Learning Library</Text>
                <TouchableOpacity style={styles.docDetailsBtn} onPress={() => setSelectedDocumentDetail({ ...doc, id: doc.code || doc.id })}><Text style={styles.docDetailsText}>Xem chi tiết tài liệu  ›</Text></TouchableOpacity>
                {selectedLearningDoc === doc.id && <View style={styles.learningTools}><TouchableOpacity style={styles.quizButton} onPress={() => openAiQuiz(doc)}><Text style={styles.quizButtonText}>✦ Làm Quiz AI</Text></TouchableOpacity><Text style={styles.ratingLabel}>Đánh giá tài liệu này</Text><View style={styles.ratingRow}>{[1,2,3,4,5].map(star => <TouchableOpacity key={star} onPress={() => handleRateDocument(doc.id, star)}><Text style={[styles.star, (documentRatings[doc.id] || 0) >= star && styles.starActive]}>★</Text></TouchableOpacity>)}</View></View>}
                {unlockedDocs[doc.code || doc.id] ? <View style={styles.unlockedBox}><Text style={styles.linkText}>Đã mở khóa · Sẵn sàng học và làm quiz</Text></View> : null}
              </View>
            ))}
          </ScrollView>
        )}

        {/* 3. MENTOR */}
        {currentTab === 'mentor' && userRole !== 'mentor' && <FindMentor mentors={mentorProfiles} courses={courses} currentTerm={currentTerm} bookings={myBookings} onBook={triggerBooking} />}

        {currentTab === 'profile' && userRole === 'mentor' && <MentorProfileHub user={{...currentUser, avatarUrl}} onUpdate={async next => { setCurrentUser(next); await Database.updateUserData(email, { fullName: next.fullName, mentorBio: next.mentorBio, mentorFee: next.mentorFee, mentorCourses: next.mentorCourses, bankAccount: next.bankAccount, availableXu: next.availableXu }); }} onLogout={() => setIsLoggedIn(false)} />}
        {currentTab === 'profile' && userRole !== 'mentor' && <ProfileHub user={{...currentUser, avatarUrl}} university={university} currentTerm={currentTerm} userXu={userXu} bookings={myBookings} mentors={mentorProfiles} documents={[...fptData, ...mentorDocuments]} unlockedDocs={unlockedDocs} onEdit={() => setShowEditProfileModal(true)} onTopUp={() => {setTopUpStandalone(true);setShowTopUpModal(true);}} onOpenDocument={(doc) => setSelectedDocumentDetail(doc)} onOpenSchedule={() => setCurrentTab('schedule')} onOpenChat={() => setCurrentTab('chat')} onChangePassword={() => setShowChangePassword(true)} onClaimReward={async () => { const next = userXu + 1; setUserXu(next); await Database.updateUserData(email, { userXu: next }); setNotice({ title: 'Nhận thưởng thành công', message: 'Đã cộng 1 Xu vào Ví PSIFU.' }); }} onUpdateBooking={handleUpdateBooking} onLogout={() => setIsLoggedIn(false)} />}

        {/* 4. PROFILE */}
        {false && (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <View style={[styles.userOverviewCard, themeCard]}>
              <View style={styles.avatarCircle}><Text style={{fontSize: 32}}>🎓</Text></View>
              <Text style={[styles.overviewName, themeText]}>{fullName || 'Chưa cập nhật'}</Text>
              <Text style={styles.overviewSchool}>{university || 'Chưa thiết lập trường'} — {currentTerm}</Text>
              
              {isPremium && (
                <View style={styles.premiumBadge}><Text style={{color: '#fff', fontWeight: 'bold', fontSize: 11}}>👑 THÀNH VIÊN PREMIUM</Text></View>
              )}

              <TouchableOpacity style={styles.btnTriggerEdit} onPress={() => setShowEditProfileModal(true)}>
                <Text style={{color: '#0284c7', fontWeight: 'bold', fontSize: 13}}>✏️ CHỈNH SỬA THÔNG TIN HỒ SƠ</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, themeText]}>Cài đặt ứng dụng</Text>
            <View style={[styles.profileFormBox, themeCard]}>
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, themeText]}>Chế độ nền tối (Dark Mode)</Text>
                <TouchableOpacity style={[styles.toggleBtn, {backgroundColor: isDarkMode ? '#10b981' : '#cbd5e1'}]} onPress={() => setIsDarkMode(!isDarkMode)}>
                  <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 11}}>{isDarkMode ? 'BẬT' : 'TẮT'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.sectionTitle, themeText]}>Gói dịch vụ cao cấp</Text>
            <View style={[styles.profileFormBox, themeCard]}>
              <Text style={[styles.premiumHeaderTitle, themeText]}>Nâng Cấp Gói Premium PSIFU 💎</Text>
              <Text style={styles.premiumDesc}>Xem không giới hạn mọi tài liệu độc quyền chất lượng cao từ tất cả các mentor, tăng tốc lộ trình học tập vượt trội.</Text>
              <TouchableOpacity style={[styles.btnSaveProfile, {backgroundColor: isPremium ? '#64748b' : '#b45309'}]} onPress={handleBuyPremium} disabled={isPremium}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>{isPremium ? 'ĐÃ SỞ HỮU PREMIUM' : 'MUA GÓI PREMIUM'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
              <Text style={{color: '#ef4444', fontWeight: 'bold'}}>ĐĂNG XUẤT TIẾN TRÌNH</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* THANH NAVIGATION BAR ĐƯỢC ĐIỀU CHỈNH THỨ TỰ CHUẨN */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentTab('home')}>
          <Ionicons name={currentTab === 'home' ? 'home' : 'home-outline'} size={20} color={currentTab === 'home' ? '#173F83' : '#71829D'} />
          <Text style={[styles.navLabel, currentTab === 'home' && styles.navActiveText]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentTab('community')}>
          <Ionicons name={currentTab === 'community' ? 'people' : 'people-outline'} size={20} color={currentTab === 'community' ? '#173F83' : '#71829D'} />
          <Text style={[styles.navLabel, currentTab === 'community' && styles.navActiveText]}>Community</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentTab('mentor')}>
          <Ionicons name={currentTab === 'mentor' ? 'school' : 'school-outline'} size={20} color={currentTab === 'mentor' ? '#173F83' : '#71829D'} />
          <Text style={[styles.navLabel, currentTab === 'mentor' && styles.navActiveText]}>{userRole === 'mentor' ? 'Sessions' : 'Mentor'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentTab('schedule')}>
          <Ionicons name={currentTab === 'schedule' ? 'calendar' : 'calendar-outline'} size={20} color={currentTab === 'schedule' ? '#173F83' : '#71829D'} />
          <Text style={[styles.navLabel, currentTab === 'schedule' && styles.navActiveText]}>Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentTab('profile')}>
          <Ionicons name={currentTab === 'profile' ? 'person' : 'person-outline'} size={20} color={currentTab === 'profile' ? '#173F83' : '#71829D'} />
          <Text style={[styles.navLabel, currentTab === 'profile' && styles.navActiveText]}>Profile</Text>
        </TouchableOpacity>
      </View>
      <ToastNotice notice={notice} onClose={() => setNotice(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  lightContainer: { backgroundColor: '#FFFFFF' },
  darkContainer: { backgroundColor: '#FFFFFF' },
  lightText: { color: '#102A56' },
  darkText: { color: '#102A56' },
  lightCard: { backgroundColor: '#FFFFFF', borderColor: '#C9D6E8' },
  darkCard: { backgroundColor: '#FFFFFF', borderColor: '#C9D6E8' },

  sectionTitle: { fontSize: 15, fontWeight: 'bold', marginTop: 15, marginBottom: 12 },
  docsHero: { backgroundColor: '#102A56', borderRadius: 18, padding: 17, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13 },
  docsEyebrow: { color: '#BFD6FF', fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  docsTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', marginTop: 5 },
  docsSubtitle: { color: '#D7E5F7', fontSize: 11, marginTop: 5, maxWidth: 215, lineHeight: 16 },
  docsCoin: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFFFF', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 15 },
  docsCoinText: { color: '#173F83', fontSize: 10, fontWeight: '900' },
  docsSearch: { height: 47, borderRadius: 13, borderWidth: 1, borderColor: '#C9D6E8', backgroundColor: '#FFFFFF', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  docsSearchInput: { flex: 1, color: '#102A56', fontSize: 13 },
  
  bannerItem: { width: width - 40, padding: 20, borderRadius: 14, marginRight: 10, justifyContent: 'center', height: 110 },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  bannerDesc: { color: '#fef08a', fontSize: 13, fontWeight: '500' },

  tabFilterBtn: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, borderRadius: 8, backgroundColor: '#e2e8f0' },
  tabFilterBtnActive: { backgroundColor: '#0284c7' },
  tabFilterText: { fontWeight: '600', color: '#64748b', fontSize: 13 },
  tabFilterTextActive: { color: '#fff' },
  docCard: { padding: 16, borderRadius: 12, marginBottom: 14, borderWidth: 1 },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  docId: { fontWeight: 'bold', color: '#0284c7', fontSize: 15 },
  docPrice: { fontWeight: '700' },
  docName: { fontSize: 14, marginBottom: 14 },
  docDetailsBtn: { marginTop: 8, marginBottom: 8, alignSelf: 'flex-start' },
  docDetailsText: { color: '#2563eb', fontWeight: '700', fontSize: 12 },
  learningTools: { backgroundColor: '#eff6ff', borderRadius: 10, borderWidth: 1, borderColor: '#bfdbfe', padding: 10, marginBottom: 10 },
  quizButton: { backgroundColor: '#2563eb', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  quizButtonText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  ratingLabel: { color: '#475569', fontWeight: '700', fontSize: 12, marginTop: 11 },
  ratingRow: { flexDirection: 'row', marginTop: 4, gap: 6 },
  star: { color: '#cbd5e1', fontSize: 24 },
  starActive: { color: '#f59e0b' },
  mentorDocumentMeta: { fontSize: 12, color: '#64748b', marginBottom: 10 },
  documentProvider: { fontSize: 10, color: '#64748b', marginTop: -8, marginBottom: 8 },
  btnUnlock: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#0284c7', borderStyle: 'dashed' },
  btnUnlockText: { color: '#0284c7', fontWeight: '600', fontSize: 14 },
  unlockedBox: { backgroundColor: '#f0fdf4', padding: 12, borderRadius: 8 },
  linkText: { color: '#15803d', fontStyle: 'italic', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', width: '100%', padding: 24, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#C9D6E8' },
  closeModalButton: { position: 'absolute', top: 10, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEF4FC', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  closeModalText: { color: '#102A56', fontSize: 24, lineHeight: 27, fontWeight: '500' },
  modalTitle: { fontSize: 19, fontWeight: 'bold', color: '#102A56', marginBottom: 10 },
  modalSub: { fontSize: 13, color: '#536E99', textAlign: 'center', marginBottom: 15, lineHeight: 18 },
  popupLabel: { alignSelf: 'flex-start', fontSize: 12, fontWeight: 'bold', color: '#355476', marginBottom: 4, marginTop: 10 },
  popupInput: { width: '100%', backgroundColor: '#F4F7FC', padding: 12, borderRadius: 8, fontSize: 14, color: '#102A56', borderWidth: 1, borderColor: '#C9D6E8' },
  btnPopupSubmit: { backgroundColor: '#102A56', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  bookingOptions: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', gap: 8, marginBottom: 8 },
  bookingScroll: { width: '100%', maxHeight: 300 },
  bookingScrollContent: { paddingBottom: 8 },
  bookingSubmitButton: { marginTop: 12 },
  bookingOption: { borderWidth: 1, borderColor: '#344966', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#1C2A42' },
  bookingOptionActive: { backgroundColor: '#1D4ED8', borderColor: '#3B82F6' },
  bookingOptionText: { color: '#BDD3F4', fontSize: 12, fontWeight: '600' },
  bookingOptionTextActive: { color: '#fff' },
  topUpCard: { backgroundColor: '#0F1C33', width: '100%', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#344966' },
  balanceCard: { backgroundColor: '#1C2A42', borderWidth: 1, borderColor: '#344966', borderRadius: 12, padding: 13, marginTop: 4 },
  balanceLabel: { color: '#8296B5', fontSize: 10, fontWeight: '800' },
  balanceValue: { color: '#F5F8FF', fontSize: 20, fontWeight: '900', marginTop: 5 },
  topUpNotice: { backgroundColor: '#112448', borderWidth: 1, borderColor: '#244A88', borderRadius: 10, padding: 11, marginTop: 11 },
  topUpNoticeText: { color: '#BDD3F4', fontSize: 12, lineHeight: 17 },
  packageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 4 },
  packageCard: { width: '48%', backgroundColor: '#1C2A42', borderWidth: 1, borderColor: '#344966', borderRadius: 10, padding: 11 },
  packageActive: { borderColor: '#3B82F6', backgroundColor: '#142C56' },
  packageCoin: { color: '#F5F8FF', fontWeight: '900', fontSize: 14 },
  packageSub: { color: '#86A1C4', fontSize: 9, marginTop: 5 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1C2A42', borderColor: '#3B82F6', borderWidth: 1, borderRadius: 10, padding: 11, marginTop: 16 },
  paymentTitle: { color: '#F4F8FF', fontWeight: '800', fontSize: 12 },
  paymentSub: { color: '#8194B1', fontSize: 9, marginTop: 2 },
  selectedPayment: { marginLeft: 'auto', color: '#60A5FA', fontSize: 10, fontWeight: '800' },
  topUpSummary: { backgroundColor: '#1C2A42', borderRadius: 10, padding: 11, marginTop: 10, gap: 6 },
  summaryText: { color: '#AFC1DC', fontSize: 11 }, summaryStrong: { color: '#F4F8FF', fontWeight: '800' }, summaryGreen: { color: '#34D399', fontWeight: '900' },

  mentorCard: { padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1 },
  bookingHistoryCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  bookingHistoryTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  bookingHistoryText: { color: '#475569', fontSize: 13, lineHeight: 20 },
  mentorHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  mentorAvatar: { fontSize: 36 },
  mentorName: { fontSize: 16, fontWeight: 'bold' },
  mentorRole: { fontSize: 12, color: '#0284c7', fontWeight: '600', marginTop: 1 },
  mentorBio: { fontSize: 13, color: '#64748b', marginTop: 10, lineHeight: 18 },
  mentorPostBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, marginTop: 12, borderWidth: 1, borderColor: '#cbd5e1' },
  mentorPostTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 4 },
  mentorPostContent: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  mentorActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  btnMentorDoc: { backgroundColor: '#fef08a', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, flex: 0.48, alignItems: 'center', borderWidth: 1, borderColor: '#facc15' },
  btnMentorDocText: { color: '#854d0e', fontWeight: 'bold', fontSize: 13 },
  btnMentorMeet: { backgroundColor: '#0284c7', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, flex: 0.48, alignItems: 'center' },
  btnMentorMeetText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  userOverviewCard: { padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 15, borderWidth: 1 },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarPicker: { width: 72, height: 72, borderRadius: 25, alignSelf: 'center', marginBottom: 6, position: 'relative' },
  avatarPreview: { width: '100%', height: '100%', borderRadius: 25 },
  avatarFallback: { width: '100%', height: '100%', borderRadius: 25, backgroundColor: '#102A56', alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  avatarEditBadge: { position: 'absolute', right: -3, bottom: -3, width: 27, height: 27, borderRadius: 10, backgroundColor: '#1976D2', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  avatarHint: { alignSelf: 'center', color: '#536E99', fontSize: 10, fontWeight: '700', marginBottom: 12 },
  overviewName: { fontSize: 18, fontWeight: 'bold' },
  overviewSchool: { fontSize: 13, color: '#64748b', marginTop: 2 },
  premiumBadge: { backgroundColor: '#b45309', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, marginTop: 8 },
  btnTriggerEdit: { marginTop: 16, padding: 8 },
  profileFormBox: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLabel: { fontSize: 14, fontWeight: '600' },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  premiumHeaderTitle: { fontSize: 15, fontWeight: 'bold', color: '#b45309', marginBottom: 6 },
  premiumDesc: { fontSize: 12, color: '#64748b', lineHeight: 18, marginBottom: 14 },
  btnSaveProfile: { padding: 14, borderRadius: 8, alignItems: 'center' },
  btnLogout: { marginTop: 20, alignItems: 'center', padding: 10, marginBottom: 30 },

  navBar: { flexDirection: 'row', height: 62, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E8EBF3', paddingBottom: 4 },
  navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navIcon: { fontSize: 18, color: '#94a3b8' },
  navLabel: { fontSize: 9, color: '#7B879D', marginTop: 3, fontWeight: '700' },
  navActiveText: { color: '#1558D8', fontWeight: '900' }
});
