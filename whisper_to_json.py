#!/usr/bin/env python3
"""
Whisper Audio Analysis Tool
오디오 파일을 Whisper로 분석해서 채팅 앱용 JSON 파일을 생성합니다.
"""

import whisper
import json
import sys
import os
from pathlib import Path
import argparse
from typing import List, Dict, Any

def analyze_audio_with_whisper(audio_path: str, model_size: str = "base") -> Dict[str, Any]:
    """
    Whisper로 오디오 파일을 분석합니다.
    
    Args:
        audio_path: 오디오 파일 경로
        model_size: Whisper 모델 크기 ("tiny", "base", "small", "medium", "large")
    
    Returns:
        Whisper 분석 결과
    """
    print(f"오디오 파일 로딩: {audio_path}")
    print(f"Whisper 모델 로딩: {model_size}")
    
    # Whisper 모델 로드
    model = whisper.load_model(model_size)
    
    # 오디오 분석 (한국어 설정)
    print("음성 인식 시작...")
    result = model.transcribe(
        audio_path,
        language="ko",  # 한국어 지정
        word_timestamps=True,  # 단어별 타이밍 활성화
        task="transcribe"  # 번역이 아닌 전사
    )
    
    print(f"분석 완료! {len(result['segments'])}개 구간 탐지")
    return result

def group_segments_by_speaker(segments: List[Dict], min_gap: float = 2.0) -> List[Dict]:
    """
    음성 구간을 화자별로 그룹화합니다.
    더 정확한 화자 분리를 위해 다양한 조건을 사용합니다.
    
    Args:
        segments: Whisper 구간 데이터
        min_gap: 화자 변경을 판단할 최소 무음 간격 (초)
    
    Returns:
        화자별로 그룹화된 구간 리스트
    """
    if not segments:
        return []
    
    total_duration = segments[-1]['end'] if segments else 0
    print(f"화자 분리 시도: 총 {len(segments)}개 구간, 전체 길이 {total_duration:.1f}초")
    
    # 더 스마트한 화자 분리 로직
    grouped_segments = []
    current_speaker = 1
    current_group = []
    speaker_changes = []
    
    # 1단계: 긴 무음 구간을 찾아 화자 변경 후보 지점 탐지
    for i in range(1, len(segments)):
        gap = segments[i]['start'] - segments[i-1]['end']
        if gap > min_gap:
            speaker_changes.append({
                'index': i,
                'gap': gap,
                'time': segments[i]['start']
            })
            print(f"   무음 구간 감지: {gap:.1f}초 at {segments[i]['start']:.1f}s")
    
    # 2단계: 화자 변경이 없으면 시간 기반으로 분할
    if not speaker_changes:
        # 전체를 3등분해서 화자 변경 지점 찾기
        third_1 = total_duration / 3
        third_2 = total_duration * 2 / 3
        
        for i, segment in enumerate(segments):
            if segment['start'] > third_1 and not any(sc['time'] < third_1 + 5 for sc in speaker_changes):
                speaker_changes.append({
                    'index': i,
                    'gap': 0,
                    'time': segment['start']
                })
                print(f"   시간 기반 분할점 추가: {segment['start']:.1f}s (1/3 지점)")
                break
        
        for i, segment in enumerate(segments):
            if segment['start'] > third_2 and not any(sc['time'] < third_2 + 5 for sc in speaker_changes):
                speaker_changes.append({
                    'index': i,
                    'gap': 0,
                    'time': segment['start']
                })
                print(f"   시간 기반 분할점 추가: {segment['start']:.1f}s (2/3 지점)")
                break
    
    # 3단계: 화자 변경 지점을 기준으로 그룹 생성
    change_indices = [0] + [sc['index'] for sc in speaker_changes] + [len(segments)]
    change_indices = sorted(list(set(change_indices)))  # 중복 제거 및 정렬
    
    for i in range(len(change_indices) - 1):
        start_idx = change_indices[i]
        end_idx = change_indices[i + 1]
        group_segments = segments[start_idx:end_idx]
        
        if group_segments:  # 빈 그룹 방지
            speaker_num = (i % 2) + 1  # 1, 2 번갈아가며
            grouped_segments.append({
                'speaker': speaker_num,
                'segments': group_segments,
                'start_time': group_segments[0]['start'],
                'end_time': group_segments[-1]['end']
            })
            print(f"   Speaker {speaker_num} 생성: {len(group_segments)}개 구간 ({group_segments[0]['start']:.1f}s - {group_segments[-1]['end']:.1f}s)")
    
    # 4단계: 최소 2명 화자 보장
    if len(grouped_segments) < 2 and len(segments) > 3:
        print("   화자 수 부족, 강제 분할")
        # 전체를 반으로 나누기
        mid_point = len(segments) // 2
        grouped_segments = [
            {
                'speaker': 1,
                'segments': segments[:mid_point],
                'start_time': segments[0]['start'],
                'end_time': segments[mid_point-1]['end']
            },
            {
                'speaker': 2,
                'segments': segments[mid_point:],
                'start_time': segments[mid_point]['start'],
                'end_time': segments[-1]['end']
            }
        ]
        print(f"   강제 분할 완료: Speaker 1 ({mid_point}개), Speaker 2 ({len(segments)-mid_point}개)")
    
    return grouped_segments

def create_chat_format(grouped_segments: List[Dict]) -> List[Dict]:
    """
    채팅 앱 형식으로 데이터를 변환합니다.
    
    Args:
        grouped_segments: 화자별 그룹화된 구간
    
    Returns:
        채팅 앱용 JSON 형식 데이터
    """
    chat_data = []
    
    for group in grouped_segments:
        speaker = group['speaker']
        segments = group['segments']
        
        # 각 구간을 적절한 크기로 나누어 세그먼트 생성
        chat_segments = []
        
        for segment in segments:
            text = segment['text'].strip()
            if not text:
                continue
                
            # 긴 텍스트는 문장 단위로 분할
            sentences = split_into_sentences(text)
            
            if len(sentences) <= 1:
                # 짧은 구간은 그대로 사용
                chat_segments.append({
                    "text": text,
                    "startTime": round(segment['start'], 1),
                    "endTime": round(segment['end'], 1)
                })
            else:
                # 긴 구간은 문장별로 시간 분배
                total_duration = segment['end'] - segment['start']
                sentence_duration = total_duration / len(sentences)
                
                for i, sentence in enumerate(sentences):
                    start_time = segment['start'] + (i * sentence_duration)
                    end_time = start_time + sentence_duration
                    
                    chat_segments.append({
                        "text": sentence.strip(),
                        "startTime": round(start_time, 1),
                        "endTime": round(end_time, 1)
                    })
        
        if chat_segments:
            chat_data.append({
                "speaker": speaker,
                "segments": chat_segments
            })
    
    return chat_data

def split_into_sentences(text: str) -> List[str]:
    """
    텍스트를 문장 단위로 분할합니다.
    
    Args:
        text: 분할할 텍스트
    
    Returns:
        문장 리스트
    """
    import re
    
    # 한국어 문장 구분자 기준으로 분할
    sentences = re.split(r'[.!?。！？]', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    # 너무 짧은 문장들은 합치기
    if len(sentences) > 1:
        merged_sentences = []
        current_sentence = ""
        
        for sentence in sentences:
            if len(current_sentence + sentence) < 50:  # 50자 미만이면 합치기
                current_sentence += sentence + " "
            else:
                if current_sentence:
                    merged_sentences.append(current_sentence.strip())
                current_sentence = sentence + " "
        
        if current_sentence:
            merged_sentences.append(current_sentence.strip())
            
        return merged_sentences if merged_sentences else [text]
    
    return [text]

def print_analysis_summary(whisper_result: Dict, chat_data: List[Dict]):
    """
    분석 결과 요약을 출력합니다.
    """
    total_duration = whisper_result.get('duration', 0)
    total_segments = len(whisper_result.get('segments', []))
    total_speakers = len(chat_data)
    
    print(f"\n분석 결과 요약:")
    print(f"   총 길이: {total_duration:.1f}초 ({total_duration//60:.0f}분 {total_duration%60:.0f}초)")
    print(f"   원본 구간: {total_segments}개")
    print(f"   화자 수: {total_speakers}명")
    
    for i, speaker_data in enumerate(chat_data):
        speaker = speaker_data['speaker']
        segments = speaker_data['segments']
        total_text = ' '.join([seg['text'] for seg in segments])
        
        print(f"   Speaker {speaker}: {len(segments)}개 세그먼트, {len(total_text)}자")
        print(f"      미리보기: {total_text[:100]}...")

def main():
    parser = argparse.ArgumentParser(description="Whisper로 오디오 파일을 분석하여 채팅 앱용 JSON을 생성합니다.")
    parser.add_argument("audio_file", help="분석할 오디오 파일 경로", default="audio.wav")
    parser.add_argument("-m", "--model", default="base", 
                       choices=["tiny", "base", "small", "medium", "large"],
                       help="Whisper 모델 크기 (기본값: base)")
    parser.add_argument("-o", "--output", help="출력 JSON 파일 경로 (기본값: whisper-analysis.json)")
    parser.add_argument("--min-gap", type=float, default=2.0,
                       help="화자 변경을 판단할 최소 무음 간격 (초, 기본값: 2.0)")
    
    args = parser.parse_args()
    
    # 오디오 파일 확인
    audio_path = Path(args.audio_file)
    if not audio_path.exists():
        print(f"오디오 파일을 찾을 수 없습니다: {audio_path}")
        sys.exit(1)
    
    # 출력 파일 경로 설정
    if args.output:
        output_path = Path(args.output)
    else:
        output_path = audio_path.parent / "whisper-analysis.json"
    
    try:
        # 1. Whisper로 오디오 분석
        whisper_result = analyze_audio_with_whisper(str(audio_path), args.model)
        
        # 2. 화자별 그룹화
        print(f"화자별 그룹화 (최소 간격: {args.min_gap}초)")
        grouped_segments = group_segments_by_speaker(whisper_result['segments'], args.min_gap)
        
        # 3. 채팅 앱 형식으로 변환
        print("채팅 앱 형식으로 변환")
        chat_data = create_chat_format(grouped_segments)
        
        # 4. 결과 요약 출력
        print_analysis_summary(whisper_result, chat_data)
        
        # 5. JSON 파일로 저장
        print(f"JSON 파일 저장: {output_path}")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(chat_data, f, ensure_ascii=False, indent=2)
        
        # 6. 원본 Whisper 결과도 저장 (디버깅용)
        debug_path = output_path.parent / f"{output_path.stem}_debug.json"
        with open(debug_path, 'w', encoding='utf-8') as f:
            json.dump(whisper_result, f, ensure_ascii=False, indent=2)
        
        print(f"완료!")
        print(f"   채팅 앱용 JSON: {output_path}")
        print(f"   디버깅용 JSON: {debug_path}")
        print(f"\n사용법: 채팅 앱에서 '{output_path}' 파일을 업로드하세요!")
        
    except Exception as e:
        print(f"오류 발생: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()