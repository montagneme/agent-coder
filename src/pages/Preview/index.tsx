import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from "classnames/bind";
import styles from './index.module.less';
import { getComponents } from './services';
import { useSearchParams } from 'react-router-dom';
import { getTemplateCode } from '../../compiler/react';
import injectContext from '../../context';

const cx = classNames.bind(styles);

enum Status {
    Loading = 'Loading',
    Success = 'Success',
    Error = 'Error',
    Empty = 'Empty'
}

interface IComponent {
    id: string;
    code: string;
    css: string;
}

function Preview() {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const [components, setComponents] = useState<IComponent[]>([]);
    const [status, setStatus] = useState<Status>(Status.Loading);

    useEffect(() => {
        injectContext();
        init();
    }, [])

    const init = useCallback(async () => {
        if (!id) return setStatus(Status.Error);
        const res = await getComponents(id);
        if (res.code === 'success') {
            const { components } = res.data;
            if (!components || !components.length) return setStatus(Status.Empty);
            setStatus(Status.Success);
            setComponents(components);
            console.log('components', components);
        }
    }, []);

    useEffect(() => {
        for (const { id, code, css } of components) {
            const templateCode = getTemplateCode(id, code, css);
            try {
                new Function(templateCode)();
            } catch (error) {
                console.log(error);
            }
        }
    }, [components]);

    return <div className={cx("preview")}>
        {
            components.map(({ id }) => <div key={id} id={id} className={cx("component")} />)
        }
    </div>;
}

export default Preview;
