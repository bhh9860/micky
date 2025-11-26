import React from 'react';
import { Clock, GitCommit, CheckCircle2 } from 'lucide-react';

const VersionHistory = () => {
  const history = [
    {
      version: '2.4-Restored',
      date: '2025-11-26',
      changes: [
        '시스템 복구: 최근 적용된 6가지 기능(클래스 추가/삭제, 자동 등급 산출 등)을 롤백하여 이전 안정화 버전(v2.4) 상태로 복구',
        '안정화 유지: 0으로 나누기 방지(v2.6) 및 중복 선언 오류 수정 패치는 유지됨',
        '기능 상태: Class Progress 수동 입력 복귀, Attitude 등급 "Bad" 복귀'
      ]
    },
    {
      version: '2.6',
      date: '2025-11-26',
      changes: [
        '긴급 수정: 그래프 및 성적 계산 시 0으로 나누기 오류(Division by Zero)로 인한 런타임 크래시 해결',
        '안정성 강화: 데이터 로딩 시점의 불완전한 데이터에 대한 방어 코드 추가 (초기 실행 오류 방지)',
        '로직 보완: 클래스 정보가 없거나 배점이 0인 경우에도 안전한 기본값(60점)을 사용하여 계산하도록 수정'
      ]
    },
    {
      version: '2.5',
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
      version: '2.4',
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
      version: '2.3',
      date: '2025-11-26',
      changes: [
        'UI 개선: 과목관리(Tab 3)의 배점 조절 화살표가 잘리는 현상 수정 (세부학생관리 탭과 동일한 스타일 적용)',
        '기능 추가: 과목관리(Tab 3)에서 과목 추가/삭제 및 카테고리명(L&S, R&W) 변경 기능 구현',
        '시스템 연동: Firebase 연결 정보 갱신 및 과목 설정(Subject Config) 데이터의 DB 저장/연동 구현'
      ]
    },
    {
      version: '2.2',
      date: '2025-11-26',
      changes: [
        '기능 개선: 세부학생관리(Tab 2)에서 학생의 학교 정보를 드롭다운으로 수정 가능하도록 변경 (전체학생관리 설정 연동)',
        '시스템 연동: Firebase Firestore 데이터베이스 정식 연결 완료',
        '데이터 관리: 최초 실행 시 데이터가 없을 경우, 학생 20명 및 2023년 1월~2025년 10월 성적 데이터 자동 생성(Seeding) 로직 구현'
      ]
    },
    {
      version: '2.1',
      date: '2025-11-26',
      changes: [
        '기능 개선: 세부학생관리(Tab 2) 성적 표의 조회 기간 로직 수정',
        '버그 수정: 점수입력(Tab 4)에서 미래 시점(다음 달 등)의 점수를 입력해도 세부학생관리 목록에 즉시 반영되도록 개선 (기존에는 오늘 날짜까지만 표시됨)'
      ]
    },
    {
      version: '2.0',
      date: '2025-11-26',
      changes: [
        '로직 변경: 학생의 현재 클래스(Student Info)와 과거 성적의 클래스(Score History)를 완전 분리',
        '버그 수정: 학생 정보(상단)에서 클래스를 변경해도, 이미 입력된 과거 성적의 클래스는 절대 변경되지 않도록 수정',
        '데이터 보정: 초기 샘플 데이터(S001)에도 당시 클래스 정보를 영구 기록하여 불변성 보장'
      ]
    },
    {
      version: '1.9',
      date: '2025-11-26',
      changes: [
        '기능 추가: 상단 탭 메뉴에 "7. 수정사항" 추가 및 버전 관리 페이지 구현',
        '문서화: 개발 진행 상황에 따른 버전별 변경 이력 상세 기록 (Ver 1.0 ~ 1.9)'
      ]
    },
    {
      version: '1.8',
      date: '2025-11-26',
      changes: [
        '기능 추가: 세부학생관리(Tab 2) 종합 분석 대시보드에 "기간(클래스) 필터" 기능 추가 (특정 클래스 기간의 성적만 조회 가능)',
        '로직 개선: 과거 성적 데이터의 클래스 정보 불변성 보장 (학생의 현재 클래스가 변경되어도 과거 성적은 당시 클래스로 유지)',
        '버그 수정: 세부학생관리(Tab 2) 성적 관리 표의 Class 선택 드롭다운 동작 오류 수정 및 데이터 연동 강화'
      ]
    },
    {
      version: '1.7',
      date: '2025-11-26',
      changes: [
        'UI 개선: 과목관리(Tab 3) L&S와 R&W 설정 영역 레이아웃 통일 (높이, 정렬 일치)',
        'UI 개선: 과목관리(Tab 3) 배점 입력 칸의 화살표(Spinner) 잘림 현상 수정',
        'UI 개선: 세부학생관리(Tab 2) 성적 표의 Class 열을 드롭다운으로 변경하여 수정 가능하도록 개선',
        '기능 추가: 세부학생관리(Tab 2) 성적 표에서 마우스 오버 시(Tooltip) 해당 시점의 과목명 표시 기능 추가',
        'UI 개선: 현재 클래스와 다른 과거 기록은 노란색 배경으로 강조 표시'
      ]
    },
    {
      version: '1.6',
      date: '2025-11-26',
      changes: [
        '기능 추가: "3. 과목관리" 탭 신설 - 클래스별 과목명 및 배점 커스텀 설정 기능 구현',
        '구조 변경: 탭 순서 재배치 (과목관리 추가로 기존 3~5번 탭이 4~6번으로 변경)',
        '기능 추가: 점수입력(Tab 4) 화면에 "클래스 선택 필터" 및 체크박스 기능 추가 (클래스별 학생 필터링)',
        '기능 추가: 세부학생관리(Tab 2) 및 성적표(Tab 5)에 클래스별 동적 과목명/배점 반영 로직 적용'
      ]
    },
    {
      version: '1.5',
      date: '2025-11-26',
      changes: [
        'UI 개선: 세부학생관리(Tab 2) 성적 관리 표 헤더 디자인을 점수입력(Tab 4) 탭과 동일하게 통일 (2단 구조, 색상 적용)',
        'UI 개선: 세부학생관리(Tab 2) 표의 Date, Total, 삭제 컬럼 너비 및 패딩 최적화'
      ]
    },
    {
      version: '1.4',
      date: '2025-11-26',
      changes: [
        'UI 개선: 세부학생관리(Tab 2) 성적 관리 표의 입력 칸 높이 확보 및 패딩 제거 (화살표 잘림 현상 해결)',
        '스타일 통일: 점수입력(Tab 4) 탭과 동일한 입력 UI 스타일(텍스트 크기 등) 적용'
      ]
    },
    {
      version: '1.3',
      date: '2025-11-26',
      changes: [
        '데이터 구조 변경: 점수입력(Tab 4) 및 세부학생관리(Tab 2) 표 구조 통일',
        '기능 추가: Class Progress(4개 영역) 및 Attitude(2개 영역) 점수 입력/수정 기능 추가 (드롭다운 방식)'
      ]
    },
    {
      version: '1.2',
      date: '2025-11-26',
      changes: [
        '리팩토링: src/components 폴더 내 컴포넌트 파일명에 번호 부여 (1StudentManagement.jsx, 2StudentDetail.jsx 등) 및 App.jsx import 경로 수정'
      ]
    },
    {
      version: '1.1',
      date: '2025-11-26',
      changes: [
        '리팩토링: 단일 App.jsx 파일을 기능별 5개 컴포넌트(StudentManagement, StudentDetail, ScoreInput, ReportCard, Statistics)로 분리',
        '구조 개선: components 폴더 생성 및 모듈화'
      ]
    },
    {
      version: '1.0',
      date: '2025-11-26',
      changes: [
        '초기 릴리즈: 학생 관리, 세부 관리, 점수 입력, 성적표 출력, 통계 대시보드 등 5개 탭 기본 기능 구현 완료'
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
            <Clock size={14}/> 최근 업데이트: {history[0].date}
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