import React from 'react';
import { Clock, GitCommit, CheckCircle2 } from 'lucide-react';

const VersionHistory = () => {
  const history = [
    {
      version: '2.07',
      date: '2025-11-27',
      changes: [
        '기능 버그 오류 수정: 성적표(Tab 5) 출력 기준 날짜 선택 드롭다운에서 동일한 월이 중복 표시되는 문제 해결 (월 목록 중복 제거)'
      ]
    },
    {
      version: '2.06',
      date: '2025-11-27',
      changes: [
        '기능 버그 오류 수정: 성적표(Tab 5) 출력 기준 날짜 선택 드롭다운에서 데이터가 존재하지 않는 미래의 날짜나 없는 날짜가 표시되지 않도록 수정 (입력된 데이터 기반으로만 선택 가능)'
      ]
    },
    {
      version: '2.05',
      date: '2025-11-27',
      changes: [
        '기능 추가: 성적표(Tab 5) 모든 페이지 하단 우측에 학원명(MICKEY ENGLISH ACADEMY 미키영어) 표시 추가',
        'UI 개선: 상단 헤더 타이틀의 버전을 현재 배포 버전(Ver 2.05)으로 동기화'
      ]
    },
    {
      version: '2.04',
      date: '2025-11-27',
      changes: [
        '기능 버그 오류 수정: 성적표(Tab 5) Growth Trend 그래프에서 동일한 월의 데이터가 중복 표시되는 문제 해결 (날짜 기준 중복 제거)',
        '기능 추가: 성적표(Tab 5) 각 페이지 하단에 페이지 번호 표시 기능 추가 (- 1 - 형식)'
      ]
    },
    {
      version: '2.03',
      date: '2025-11-27',
      changes: [
        '기능 버그 오류 수정: 성적표(Tab 5) 상단에 출력 기준 년/월 선택 기능 추가 (선택한 날짜 기준으로 최신 성적 및 과거 이력 표시)',
        '기능 버그 오류 수정: 성적표(Tab 5) Score History 목록에 동일한 날짜의 성적이 중복 표시되는 문제 해결'
      ]
    },
    {
      version: '2.02',
      date: '2025-11-27',
      changes: [
        '기능 버그 오류 수정: 성적표(Tab 5) 상단의 Level 표시가 학생의 현재 Class가 아닌, 해당 성적(년/월) 당시의 Class 정보를 표시하도록 수정'
      ]
    },
    {
      version: '2.01',
      date: '2025-11-27',
      changes: [
        '기능 버그 오류 수정: 성적표(Tab 5) 출력 시, 클래스가 Phonics인 경우 "문항 수", "득점", "TOTAL SCORE" 등 점수 관련 항목이 표시되지 않도록 수정 (영역 및 세부 항목만 표시)',
        '기능 버그 오류 수정: 성적표(Tab 5) Monthly Evaluation 표의 "배점" 컬럼명을 "문항 수"로 변경',
        '기능 버그 오류 수정: 세부학생관리(Tab 2)에서 Grade(Class Progress)를 수동으로 변경해도 자동 계산 로직에 의해 값이 바뀌지 않던 문제 해결',
        '기능 버그 오류 수정: 학교(School) 및 학년(Grade) 목록 추가 시 데이터베이스(Firestore)에 영구 저장되도록 수정 (새로고침 시 데이터 유지)',
        '기능 버그 오류 수정: 점수 입력(Tab 4)의 초기화 버튼 클릭 시 DB에서도 해당 점수 데이터가 실제로 삭제되도록 수정',
        '기능 버그 오류 수정: Phonics 클래스 학생의 경우, 점수가 없으면 Grade(Class Progress)가 기본적으로 빈 값(선택 안 함)으로 표시되도록 수정',
        '기능 버그 오류 수정: 숫자 입력 필드(Number Input)의 화살표 버튼 스타일 및 터치 영역 개선'
      ]
    },
    {
      version: '2.0',
      date: '2025-11-27',
      changes: [
        '데이터베이스 초기화 도구 강화: "데이터 시딩" 실행 시 학생 데이터뿐만 아니라 클래스별 과목 설정(Subject Config)과 클래스 목록(Class List)까지 한 번에 자동 설정되도록 기능 추가',
        '설정 동기화: classScore.txt의 최신 과목 구성을 Firestore DB 설정에 즉시 반영'
      ]
    },
    {
      version: '1.18',
      date: '2025-11-26',
      changes: [
        '롤백(Revert): v1.16 시점의 UI 및 로직으로 복구 (PHONICS 수동 입력 기능 제거)',
        '데이터 업데이트: classScore.txt 기반으로 클래스 및 과목 설정 갱신 (PHONICS, Basic, Junior 등)',
        '데이터 시딩 복구: 9명(상/중/하) 학생 생성 로직으로 복귀'
      ]
    },
    {
      version: '1.16',
      date: '2025-11-26',
      changes: [
        'UI 개선: 점수입력(Tab 4)에서 점수가 입력되지 않은 상태(New)일 경우 Grade(Class Progress)를 표시하지 않도록 수정',
        '디자인 수정: 점수입력(Tab 4) Total 컬럼에서 점수는 중앙에, 초기화 버튼은 우측 끝에 고정 배치되도록 정렬 개선'
      ]
    },
    {
      version: '1.15',
      date: '2025-11-26',
      changes: [
        '대규모 리팩토링: 점수입력(Tab 4) 테이블을 세부학생관리(Tab 2)의 최신 로직(동적 과목 컬럼, 백분율 표시, 빈 칸 처리 등)과 동일하게 업그레이드',
        '기능 통일: 점수입력 탭에서도 클래스별 과목 수에 따라 테이블이 동적으로 변하며, Total 우측에 백분율(%) 점수가 함께 표시됨'
      ]
    },
    {
      version: '1.14',
      date: '2025-11-26',
      changes: [
        '기능 개선: 세부학생관리(Tab 2)에서 이름(Name) 필드를 "한글 이름"과 "English Name"으로 분리하여 개명 등 정보 수정 가능하도록 변경',
        '성적표 업데이트: Page 2의 "Growth Trend" 그래프 데이터를 점수(Total) 기준에서 백분율(Percentage) 기준으로 변경 (Y축 0~100%)',
        '디자인 적용: 성적표 Page 1 우측 상단 텍스트 로고를 이미지 로고(logo.jpg)로 교체'
      ]
    },
    {
      version: '1.13',
      date: '2025-11-26',
      changes: [
        'UX 개선: 성적 삭제 시 Class Progress 등급(NI 등)도 함께 제거하여 완전한 삭제 상태(Empty)임을 명확히 표시',
        '디자인 수정: 삭제된 행(회색)에 불필요한 "클래스 불일치(노란색)" 경고 스타일이 적용되지 않도록 수정'
      ]
    },
    {
      version: '1.12',
      date: '2025-11-26',
      changes: [
        '기능 완전 정상화: 세부학생관리(Tab 2) 삭제 버튼 클릭 시 DB에서도 영구 삭제되도록 로직 연결 (기존에는 화면에서만 임시 삭제됨)',
        'UX 개선: 성적 삭제 시 즉시 "회색 배경"의 "클래스 미지정" 상태(빈 칸)로 돌아가도록 수정하여 삭제 여부를 명확히 인지 가능'
      ]
    },
    {
      version: '1.11',
      date: '2025-11-26',
      changes: [
        '완전한 버그 수정: 세부학생관리(Tab 2) 목록 조회 시, 숨겨진 과목의 점수가 합계(Total)에 포함되어 계산되는 문제 해결',
        '로직 동기화: 데이터 저장 시점뿐만 아니라 조회(Display) 시점에도 클래스별 동적 과목 설정을 적용하여 "보이는 점수"만 정확히 합산'
      ]
    },
    {
      version: '1.10',
      date: '2025-11-26',
      changes: [
        '버그 수정: 세부학생관리(Tab 2)에서 클래스 변경 시, 숨겨진 과목(과목 수 차이로 인해 보이지 않는 컬럼)의 점수가 Total에 합산되는 현상 수정',
        '로직 강화: 점수 재계산 시 현재 클래스의 과목 범위를 벗어나는 점수 데이터는 강제로 0점으로 초기화(Sanitize) 처리'
      ]
    },
    {
      version: '1.09',
      date: '2025-11-26',
      changes: [
        '치명적 버그 수정: 세부학생관리(Tab 2)에서 점수 수정 시 Total 점수가 0점으로 떨어지지 않거나 잘못 합산되는 오류 해결',
        '로직 개선: 점수 합산 방식을 "고정 4개 과목"에서 "현재 클래스의 실제 과목 수"를 기반으로 동적 합산하도록 변경'
      ]
    },
    {
      version: '1.08',
      date: '2025-11-26',
      changes: [
        '로직 강화: 세부학생관리(Tab 2)에서 점수나 클래스 변경 시 Total 점수, 백분율(%), 등급(EX/GD/NI)이 즉시 재계산되도록 수정',
        '버그 수정: 클래스 변경 시 이전 클래스의 배점 기준이 유지되어 백분율이 100%를 초과(예: 101%)하던 현상 해결'
      ]
    },
    {
      version: '1.07',
      date: '2025-11-26',
      changes: [
        '버그 수정: 세부학생관리(Tab 2)에서 클래스 변경 시 과목 수 차이로 인한 테이블 깨짐/밀림 현상 완벽 해결',
        '로직 개선: 성적 이력 중 가장 많은 과목 수를 기준으로 테이블 컬럼을 자동 확보하고, 과목 수가 적은 과거 데이터는 빈 칸으로 채워 L&S/R&W 영역 정렬 유지',
        'UI 개선: 동적 테이블 렌더링 안정성 강화 (최대 과목 수 자동 감지 및 빈 셀 처리)'
      ]
    },
    {
      version: '1.06',
      date: '2025-11-26',
      changes: [
        '버그 수정: 세부학생관리(Tab 2) 진입 시 발생하던 크래시 오류(useEffect undefined) 수정 완료',
        '기능 개선: 세부학생관리(Tab 2) 성적 표가 클래스별 과목 수 설정에 따라 동적으로 컬럼이 조절되도록 변경',
        '기능 추가: 세부학생관리(Tab 2) 성적 표 Total 점수 우측에 "백분율(%)" 점수 컬럼 추가 (자동 계산)'
      ]
    },
    {
      version: '1.05',
      date: '2025-11-26',
      changes: [
        '시스템 복구: 최근 적용된 6가지 기능(클래스 추가/삭제, 자동 등급 산출 등)을 롤백하여 이전 안정화 버전(v2.4) 상태로 복구',
        '안정화 유지: 0으로 나누기 방지(v2.6) 및 중복 선언 오류 수정 패치는 유지됨',
        '기능 상태: Class Progress 수동 입력 복귀, Attitude 등급 "Bad" 복귀'
      ]
    },
    {
      version: '1.05', // Merged similar timing
      date: '2025-11-26',
      changes: [
        '긴급 수정: 그래프 및 성적 계산 시 0으로 나누기 오류(Division by Zero)로 인한 런타임 크래시 해결',
        '안정성 강화: 데이터 로딩 시점의 불완전한 데이터에 대한 방어 코드 추가 (초기 실행 오류 방지)',
        '로직 보완: 클래스 정보가 없거나 배점이 0인 경우에도 안전한 기본값(60점)을 사용하여 계산하도록 수정'
      ]
    },
    {
      version: '1.04',
      date: '2025-11-26',
      changes: [
        '기능 추가: 과목관리(Tab 3)에서 클래스(Class)를 직접 추가하거나 삭제하는 기능 구현',
        'UI 개선: 삭제 버튼을 휴지통 아이콘으로 변경하여 직관성 강화',
        '등급 체계 변경: Attitude 등급의 "Bad"를 "NI (Needs Improvement)"로 명칭 변경',
        '로직 전면 개편: Class Progress를 4개 수동 입력 과목에서 "단일 자동 산출 등급"으로 변경 (총점 백분율 기준 EX/GD/NI 자동 부여)',
        '데이터 표 수정: 모든 성적 입력 및 조회 표에서 Class Progress 컬럼을 1개로 통합하고 자동화 처리'
      ]
    },
    {
      version: '1.03',
      date: '2025-11-26',
      changes: [
        '디자인 수정: 과목관리(Tab 3) 버튼 색상 오류(다크모드 충돌) 해결',
        '기능 개선: 점수 입력 시 배점(문항 수) 초과 및 음수 입력 방지 유효성 검사 추가',
        '데이터 업데이트: "Pre Starter" 클래스 신설 및 전용 과목/문항 설정 적용',
        '로직 변경: 그래프 및 성적 계산 방식을 "배점 기준"에서 "득점/총점 백분율(%)" 방식으로 변경',
        'UI 개선: 입력 화면 및 목록에서는 과목명 영문만 표시(공간 확보), 성적표에는 전체 명칭 표시'
      ]
    },
    {
      version: '1.02',
      date: '2025-11-26',
      changes: [
        'UI 개선: 과목관리(Tab 3)의 배점 조절 화살표가 잘리는 현상 수정 (세부학생관리 탭과 동일한 스타일 적용)',
        '기능 추가: 과목관리(Tab 3)에서 과목 추가/삭제 및 카테고리명(L&S, R&W) 변경 기능 구현',
        '시스템 연동: Firebase 연결 정보 갱신 및 과목 설정(Subject Config) 데이터의 DB 저장/연동 구현'
      ]
    },
    {
      version: '1.01',
      date: '2025-11-26',
      changes: [
        '기능 개선: 세부학생관리(Tab 2)에서 학생의 학교 정보를 드롭다운으로 수정 가능하도록 변경 (전체학생관리 설정 연동)',
        '시스템 연동: Firebase Firestore 데이터베이스 정식 연결 완료',
        '데이터 관리: 최초 실행 시 데이터가 없을 경우, 학생 20명 및 2023년 1월~2025년 10월 성적 데이터 자동 생성(Seeding) 로직 구현'
      ]
    },
    {
      version: '1.00',
      date: '2025-11-26',
      changes: [
        '초기 릴리즈: 학생 관리, 세부 관리, 점수 입력, 성적표 출력, 통계 대시보드 등 5개 탭 기본 기능 구현 완료',
        '기반 구축: React + Vite + Tailwind CSS + Firebase 아키텍처 수립'
      ]
    }
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 h-full overflow-auto">
        <div className="flex items-center justify-between mb-8 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <GitCommit size={24} className="text-indigo-600"/> 수정사항
          </h2>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <Clock size={14}/> 현재 배포: ver {history[0].version} (최근 업데이트: {history[0].date})
          </div>
        </div>

        <div className="space-y-8">
          {history.map((item, idx) => (
            <div key={idx} className="relative pl-8 border-l-2 border-indigo-100 last:border-0">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm"></div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-indigo-700">Ver {item.version}</span>
                  <span className="text-sm text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded">{item.date}</span>
                  {idx === 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold animate-pulse">LATEST</span>}
                </div>
                <ul className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-2">
                  {item.changes.map((change, cIdx) => (
                    <li key={cIdx} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="mt-0.5 text-green-500 shrink-0"/>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;