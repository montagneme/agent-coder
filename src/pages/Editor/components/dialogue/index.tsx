import React, { FC, useCallback, useEffect, useState } from 'react';
import styles from './index.module.less';
import classNames from 'classnames/bind';
import { ai } from '../../services';

const cx = classNames.bind(styles);
interface IProps {
    onGenerate?: (content: { code: string; css: string }) => void;
}

type IRecord = {
    role: 'user';
    content: string;
} | {
    role: 'ai';
    content: string;
    isLoading: boolean;
}

const eventSource = new EventSource('http://localhost:3001/sse');
const Dialogue: FC<IProps> = ({ onGenerate }) => {

    const [record, setRecord] = useState<IRecord[]>([]);
    const [value, setValue] = useState('');

    useEffect(() => {
        eventSource.onmessage = (event) => {
            const { code, css, dialogueIndex, message } = JSON.parse(event?.data || '{}');
            setRecord((record) => {
                const newRecord = [...record];
                const data = newRecord[dialogueIndex];
                if (data.role === 'ai') {
                    data.content = message;
                    data.isLoading = false;
                    onGenerate?.({
                        code,
                        css
                    });
                }
                return newRecord;
            });
        };
    }, [onGenerate]);

    const generate = useCallback(async (desc: string, dialogueIndex: number) => {
        // 去生成代码
        ai({ desc, dialogueIndex });
    }, [onGenerate]);

    const handleSend = useCallback(() => {
        const newRecord = [...record];
        newRecord.push({
            role: 'user',
            content: value
        });
        newRecord.push({
            role: 'ai',
            content: '',
            isLoading: true
        })
        generate(value, newRecord.length - 1);
        setRecord(newRecord);
        setValue('');
    }, [value, generate]);

    return <div className={cx("dialogue")}>
        <div className={cx("dialogue-record")}>
            <div className={cx("record")}>
                {
                    record.map(item => item.role === 'user' ? <div className={cx("record-user")}>
                        <div className={cx("record-text")}>
                            <div className={cx("text")}>{item.content}</div>
                        </div>
                        <div className={cx("record-head")}>我</div>
                    </div> : <div className={cx("record-ai")}>
                        <div className={cx("record-head")}>ai</div>
                        <div className={cx("record-text")}>
                            <div className={cx("text")}>{item.isLoading ? "生成中..." : item.content}</div>
                        </div>
                    </div>)
                }
            </div>
        </div>
        <div className={cx("dialogue-input")}>
            <input placeholder="请描述你想要实现的组件" value={value} onChange={(e) => setValue(e.target.value)} />
            <div className={cx("dialogue-input-send")} onClick={handleSend}>发送</div>
        </div>
    </div>
};

export default Dialogue;