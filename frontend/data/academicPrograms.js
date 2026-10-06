
export const academicPrograms = [
  { id: 'it', code: 'IT', name: 'Computing', icon: 'code-slash-outline', majors: [
    { id: 'se', code: 'SE', name: 'Software Engineering', tracks: [{ id: 'nodejs', name: 'NodeJS' }, { id: 'dotnet', name: '.NET' }] },
    { id: 'ia', code: 'IA', name: 'Information Assurance / Information Security', tracks: [] }, { id: 'ai', code: 'AI', name: 'Artificial Intelligence', tracks: [] }, { id: 'is', code: 'IS', name: 'Information Systems', tracks: [] }, { id: 'gd', code: 'GD', name: 'Digital Art & Design / Graphic Design', tracks: [] },
  ] },
  { id: 'ba', code: 'BA', name: 'Business Administration', icon: 'briefcase-outline', majors: [
    { id: 'ba-mkt', code: 'BA(MKT)', name: 'Marketing', tracks: [] }, { id: 'ba-ib', code: 'BA(IB)', name: 'International Business', tracks: [] }, { id: 'mc', code: 'MC', name: 'Multimedia Communication', tracks: [] }, { id: 'ba-fin', code: 'BA(FIN)', name: 'Finance', tracks: [] }, { id: 'ba-hm', code: 'BA(HM)', name: 'Hotel Management', tracks: [] },
  ] },
  { id: 'lang', code: 'LANG', name: 'Languages', icon: 'language-outline', majors: [
    { id: 'eng', code: 'ENG', name: 'English Language', tracks: [] }, { id: 'jpn', code: 'JPN', name: 'Japanese Language', tracks: [] }, { id: 'kor', code: 'KOR', name: 'Korean Language', tracks: [] }, { id: 'chn', code: 'CHN', name: 'Chinese Language', tracks: [] },
  ] },
];

export const defaultProgram = academicPrograms[0];
