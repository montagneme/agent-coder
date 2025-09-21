import MonacoEditor, { } from '@monaco-editor/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import compiler, { defaultCode } from '../../compiler/react';
import debounce from 'lodash.debounce';
import classNames from "classnames/bind";
import styles from './index.module.less';
import Dialogue from './components/dialogue';
import { IComponent } from '../EditorPreview';
import { save } from './services';
import { useNavigate } from 'react-router-dom';

const cx = classNames.bind(styles);


function Editor() {
   const navigate = useNavigate();
  const [code, setCode] = useState(defaultCode);
  const [css, setCss] = useState('');
  const [coderMount, setCoderMount] = useState({
    code: false,
    css: false
  });
  const [activeComponent, setActiveComponent] = useState('');
  const componentData = useRef<Record<string, { code: string; css: string; compileCode?: string; compileCss?: string }>>({});
  const components = useRef<IComponent[]>([]);

  const previewPage = useRef<HTMLIFrameElement>(null);

  const compile = useCallback(debounce((componentId, code, css) => {
    if (!code && !css) return;
    if (previewPage.current && previewPage.current.contentWindow) {
      const { code: componentFragment, compileCode, compileCss, hasError, errorMessage } = compiler(componentId, code, css);
      if (!hasError) {
        componentData.current[componentId].compileCode = compileCode;
        componentData.current[componentId].compileCss = compileCss;
        previewPage.current.contentWindow.postMessage({
          type: 'render',
          id: componentId,
          code: componentFragment
        }, '*');
      } else {
        console.log('errorMessage', errorMessage);
        previewPage.current.contentWindow.postMessage({
          type: 'compile-error',
          id: componentId,
          error: errorMessage[0]
        }, '*');
      }
    }
  }, 200), []);

  useEffect(() => {
    const linstenPrevieMessage = (event: MessageEvent<{ type: 'active-component'; id: string; } | { type: 'component-list-change'; components: IComponent[] }>) => {
      switch (event.data.type) {
        case 'active-component':
          const { id } = event.data;
          setActiveComponent(id);
          !componentData.current[id] && (componentData.current[id] = { code: defaultCode, css: '' });
          const data = componentData.current[id];
          const code = data?.code || defaultCode;
          const css = data?.css || '';
          setCode(data?.code || defaultCode);
          setCss(data?.css || '');
          data.code = code;
          data.css = css;
          return;
        case 'component-list-change':
          const { components: _components } = event.data;
          components.current = _components;
          return;
      }
    };
    window.addEventListener('message', linstenPrevieMessage);
    return () => window.removeEventListener('message', linstenPrevieMessage);
  }, []);

  const handleCodeChange = useCallback((componentId: string, code: string, css: string) => {
    componentData.current[componentId] = { code, css };
    compile(componentId, code, css);
    setCode(code);
    setCss(css);
  }, [compile]);


  const handleSave = useCallback(async () => {
    const finalComponents = components.current.map(({ id }) => {
      const { compileCode, compileCss } = componentData.current[id];
      if (!compileCode) return null;
      return {
        id,
        code: compileCode,
        css: compileCss,
        type: 'react'
      };
    }).filter(Boolean);
    const res = await save({
      components: finalComponents as {
        id: string;
        code: string;
        css: string;
        type: string;
      }[]
    });
    if (res.code === 'success') {
      const pageId = res.data.pageId;
      navigate(`/preview?id=${pageId}`);
    }
  }, []);

  return (
    <div className={cx("page")}>
      {
        (!coderMount.code || !coderMount.css) && <div className={cx("loading")}>正在加载中...</div>
      }
      <div className={cx("header")}>
        <div className={cx("title")}>基于 Agent 在线编辑器</div>
        <div className={cx("share")} onClick={handleSave}>保存并预览</div>
      </div>
      <div className={cx("content")}>
        <div className={cx("worker")}>
          <div className={cx("editor")}>
            <div className={cx("coder")}>
              <MonacoEditor width="100%" height="100%" theme='vs-dark' language='javascript' value={code} onChange={(value) => value && handleCodeChange(activeComponent, value, css)} onMount={() => setCoderMount((coderMount) => ({
                ...coderMount,
                code: true
              }))} />
            </div>
            <div className={cx("coder")}>
              <MonacoEditor width="100%" height="100%" theme='vs-dark' language='css' value={css} onChange={(value) => value && handleCodeChange(activeComponent, code, value)} onMount={() => setCoderMount((coderMount) => ({
                ...coderMount,
                css: true
              }))} />
            </div>
          </div>
          <div className={cx("dialogue")}>
            <Dialogue onGenerate={({ code, css }) => {
              handleCodeChange(activeComponent, code, css)
            }} />
          </div>
        </div>
        <div className={cx("preview")}>
          <iframe className={cx("preview-content")} ref={previewPage} title="code-preview" src="/editor-preview" width="100%" height="100%" />
        </div>
      </div>
    </div>
  );
}

export default Editor;
