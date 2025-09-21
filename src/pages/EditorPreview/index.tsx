import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import classNames from "classnames/bind";
import { v4 as uuid } from 'uuid';
import styles from './index.module.less';
import injectContext from '../../context';

const cx = classNames.bind(styles);
window.React = React;
window.ReactDOM = ReactDOM;

export interface IComponent {
    id: string;
    isError?: boolean;
    error?: string;
}

function Preview() {
    const [components, setComponents] = useState<IComponent[]>([]);
    const [activeComponent, setActiveComponent] = useState('');

    const handleCreateComponent = useCallback(() => {
        const id = `component-${uuid().slice(0, 8)}`;
        const newComponents = [
            ...components,
            {
                id
            }
        ];
        setComponents(newComponents)
        // 向上层通信
        window.parent.postMessage({
            type: 'component-list-change',
            components: newComponents
        });
        return id;
    }, [components]);

    const handleActiveComponent = useCallback((id: string) => {
        setActiveComponent(id);
        // 向上层通信
        window.parent.postMessage({
            type: 'active-component',
            id
        });
    }, []);

    const renderError = useCallback((id: string, error: string) => {
        const newComponents = [...components];
        const component = newComponents.find(component => component.id === id);
        if (component) {
            component.isError = true;
            component.error = error;
        }
        setComponents(newComponents);
    }, [components]);

        const clearError = useCallback((id: string) => {
        const newComponents = [...components];
        const component = newComponents.find(component => component.id === id);
        if (component) {
            component.isError = false;
            component.error = '';
        }
        setComponents(newComponents);
    }, [components]);

    useEffect(() => {
        injectContext();
        const id = handleCreateComponent();
        handleActiveComponent(id);
    }, []);

    useEffect(() => {
        const linstenEditorMessage = (event: MessageEvent<{ type: 'render'; id: string; code: string } | { type: 'compile-error'; id: string; error: string }>) => {
            const { type, id } = event.data;
            switch (type) {
                case 'render':
                    const { code } = event.data;
                    console.log('jdpsjods', code);
                    try {
                        clearError(id);
                        new Function(code)();
                    } catch (error: any) {
                         renderError(id, error.toString());
                    }
                    return;
                case 'compile-error':
                    const { error } = event.data;
                    renderError(id, error);
                    return;
            }
        };
        window.addEventListener('message', linstenEditorMessage);
        return () => window.removeEventListener('message', linstenEditorMessage);
    }, [renderError, clearError]);

    return <div className={cx("preview")}>
        <div className={cx("preview-content")}>
            {
                components.map(({ id, isError, error }) => <div key={id} className={cx("component", activeComponent === id ? "active" : "", isError ? "error" : "")} onClick={() => handleActiveComponent(id)}>
                    {/* 组件壳子 */}
                    <div id={id} className={cx("component-instance")} />
                    {
                        isError && error && <div className={cx("component-error")}>{error}</div>
                    }
                    <div className={cx("component-operation")}>
                        <div className={cx("component-name")}>{id}</div>
                    </div>
                </div>)
            }
        </div>
        <div className={cx("preview-operation")}>
            <div className={cx("operation-create")} onClick={handleCreateComponent}>新建组件</div>
        </div>
    </div>
}

export default Preview;
