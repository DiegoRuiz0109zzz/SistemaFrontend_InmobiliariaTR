const localhostEndpoint = "http://localhost:8080/api/";
//const ipEndpoint = "http://172.17.221.214:8080/api/";
// const productionEndpoint = "";

//se cambia la base URL
const defaultEndpoint = localhostEndpoint;

const restrictions = {
    MIN_DATE_TO_MAKE_ORDER: new Date()
}

export const environment = {
    baseUrl: defaultEndpoint,
    businessRules: restrictions
}
