
// @ts-ignore
import * as babel from '@babel/standalone';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';

// 敏感全局对象
const dangerousGlobals = [
    'window', 'document', 'eval', 'Function', 'XMLHttpRequest',
    'fetch', 'localStorage', 'sessionStorage', 'indexedDB',
    'navigator', 'location', 'history', 'console'
];
// 敏感危险方法
const dangerousFunctions = ['eval', 'Function'];
// 危险属性 —— 防止 xss 攻击
const dangerousPatterns = [
    /dangerouslySetInnerHTML/g,
    /\.innerHTML\s*=/g,
    /\.outerHTML\s*=/g,
    /__html\s*:/g
];

export const getTemplateCode = (componentId: string, code: string, css: string) => {
    return `
        const context = window.context || {};
        const useState = React.useState;
        const useEffect = React.useEffect;
        const useContext = React.useContext;

        ${code}

        const CONTAINER_ID = '${componentId}';
        const container = document.getElementById(CONTAINER_ID); // 组件壳子 dom
        
        if (container) {
            ReactDOM.render(React.createElement(Main), container);
            let style = document.querySelector('style[data-component-id="${componentId}"]');
            if (!style) {
                style = document.createElement('style');
                style.setAttribute('data-component-id', '${componentId}');
                container.appendChild(style);
            }
            style.textContent = \`${css}\`;
        }
      `;
}

const compiler = (componentId: string, originCode: string, originCss: string) => {
    let code;
    let hasError = false;
    let errorMessage: string[] = [];
    try {
        const babelRes = babel.transform(originCode, {
            presets: ['react', 'typescript'],
            filename: 'index.tsx',
            plugins: [],
        });
        code = babelRes.code;
        
    } catch (e: any) {
        hasError = true;
        errorMessage = [e.toString()];
    }

    if (hasError) return {
        code: "",
        hasError,
        errorMessage
    }

    const template = getTemplateCode(componentId, code || '', originCss);

    return {
        code: template,
        compileCode: code || '',
        compileCss: originCss || '',
        hasError,
        errorMessage
    };
};

function codeReview(code: string) {
    let hasSecurityIssues = false;
    const securityErrors: string[] = [];

    const ast = parser.parse(code, {
        sourceType: "module",
        plugins: ["jsx", "typescript"]
    });

    traverse(ast, {
        Identifier(path) {
            const nodeName = path.node.name;
            if (dangerousGlobals.includes(nodeName)) {
                hasSecurityIssues = true;
                securityErrors.push(`禁止访问全局对象: ${nodeName} (行 ${path.node.loc?.start.line})`);
            }
        },
        CallExpression(path) {
            if (path.node.callee.type === 'Identifier') {
                const calleeName = path.node.callee.name;
                if (dangerousFunctions.includes(calleeName)) {
                    hasSecurityIssues = true;
                    securityErrors.push(`禁止调用危险函数: ${calleeName} (行 ${path.node.loc?.start.line})`);
                }
            }
        }
    });

    dangerousPatterns.forEach((pattern, index) => {
        let match;
        while ((match = pattern.exec(code)) !== null) {
            const lineNumber = code.substring(0, match.index).split('\n').length;
            securityErrors.push(`第 ${lineNumber} 行: 检测到潜在危险模式 "${pattern.toString()}"`);
        }
    });

    if (hasSecurityIssues) {
        return securityErrors;
    }
    return [];
}

export const defaultCode = `function Main() {}`;

export default compiler;