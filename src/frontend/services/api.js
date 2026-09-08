//tự động gán header, credentials,.. 
//vào url và data đã có và call api 
//chuyển dữ liệu trả về thành json có dạng
//{
//  status: ,
//  data
//}
export async function request(url, options = {}) {
    const defaultHeaders = {
        "Content-Type": "application/json"
    };
    const response = await fetch(url, {
        credentials: "include",
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
    }
    });
    console.log("api.js: ",response.status)
    if (response.status===429||response.status===409){
        alert('Bạn đang thao tác quá nhanh');
    }
    const data = await response.json();
    return {
        status: response.status,
        data: data
    };
}