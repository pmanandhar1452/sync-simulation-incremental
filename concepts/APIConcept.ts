export interface RequestData {
    request: string;
    method: string;
    path: string;
    input: any;
    output: any;
}

export class APIConcept {
    private requests: Map<string, RequestData> = new Map();

    request({ request, method, path, input }: {
        request: string;
        method: string;
        path: string;
        input: any;
    }) {
        const requestData: RequestData = {
            request,
            method,
            path,
            input,
            output: null
        };
        
        this.requests.set(request, requestData);
        return { request };
    }

    response({ request, output }: { request: string; output: any }) {
        const requestData = this.requests.get(request);
        if (requestData) {
            requestData.output = output;
        }
        return { request };
    }

    _get({ request }: { request: string }): RequestData[] {
        const requestData = this.requests.get(request);
        return requestData ? [requestData] : [];
    }
}
