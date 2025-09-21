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

export const getDataSource = () => request('http://localhost:3001/getDataSource', { method: 'GET' });
