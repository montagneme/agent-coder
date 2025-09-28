


const request = async (path: string, { method, data }: { method: string; data?: any; }) => {
    const res = await fetch(path, {
        method,
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
    })
    return res.json();
};

export const save = (data: {
    components: {
        id: string;
        code: string;
        css: string;
        type: string;
    }[]
}) => {
    return request('http://localhost:3001/components', {
        method: 'POST',
        data
    })
}

export const ai = (data: {
    desc: string;
    dialogueIndex: number;
}) => {
    return request(`http://localhost:3001/ai?desc=${data.desc}&dialogueIndex=${data.dialogueIndex}`, {
        method: 'GET'
    })
}