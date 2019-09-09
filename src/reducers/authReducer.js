const INTIAL_STATE = {
    isSignedIn:null,
    userId:null,
    // name:null
};

export default (state = INTIAL_STATE,action) =>{
    switch(action.type){
        case "SIGN_IN":
            return {...state,isSignedIn:true,userId:action.userId};
            // return {...state,isSignedIn:true,userId:action.userId,name:action.name};
        case "SIGN_OUT":
            return {...state,isSignedIn:false,userId:null};
         default:
            return state;
    }
}