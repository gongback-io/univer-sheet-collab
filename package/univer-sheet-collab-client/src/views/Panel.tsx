import React, {useEffect} from 'react';
import { IRevisionWorkbook } from '@gongback/univer-sheet-collab';
import "../global.css";
import {useDependency} from "@univerjs/ui";
import {LocaleService} from "@univerjs/core";

type PanelProps = {
    revisionSheet: IRevisionWorkbook[];
    onSelectRevision: (revision: IRevisionWorkbook) => void;
    selectRevision?: number;
};

export default function Panel({ revisionSheet, onSelectRevision, selectRevision }: PanelProps) {
    const localeService = useDependency(LocaleService);

    useEffect(() => {
        if (!selectRevision && revisionSheet.length > 0) {
            onSelectRevision(revisionSheet[0]);

        }
    }, [selectRevision, revisionSheet])

    return (
        <div className="panel">
            <div>
                {/* 상단 헤더 */}
                <h2 style={{ marginTop: 0 }}>{localeService.t('collab.versionHistory')}</h2>
            </div>

            {/* 버전 리스트를 감싸는 스크롤 가능한 컨테이너 */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {revisionSheet.map((rev, index) => {
                        // 가장 첫 번째(최신)는 '현재 버전' 표시
                        const isCurrent = index === 0;
                        // 날짜를 보기 좋게 포맷팅
                        const dateString = new Date(rev.at).toLocaleString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        });
                        // selectRevision 값과 비교해서 선택된 항목에 배경색 적용
                        const isSelected = selectRevision === rev.revision;

                        return (
                            <li
                                key={rev.revision}
                                className={"version-item"}
                                onClick={() => onSelectRevision(rev)}
                                style={{
                                    padding: '8px 0',
                                    borderBottom: '1px solid #eee',
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? '#d0eaff' : 'transparent',
                                }}
                            >
                                <div style={{ fontWeight: 'bold' }}>
                                    {dateString} {isCurrent && <span>{localeService.t('collab.currentVersion')}</span>}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#555' }}>
                                    {rev.name || localeService.t('collab.noname')} (Rev {rev.revision})
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
