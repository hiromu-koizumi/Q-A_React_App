import firebase from 'firebase/app';
import firestore from 'firebase/firestore';
import config from '../components/firebase-config.js';
import "firebase/auth";

firebase.initializeApp(config);
const db = firebase.firestore();

export const fetchQuestions = () => async (dispatch) => {
  const questions = [];
  var lastVisible;
  await db.collection('questions').orderBy('created','desc').limit(10).get()
    .then(snapshot => {
      snapshot.docs.map(doc => {
        //allitemsにデータを代入
        const question = {
          name: doc.data().name,
          title: doc.data().title,
          question: doc.data().question,
          questionId: doc.id,
          userId: doc.data().userId,
          goodCount: doc.data().goodCount,
          answerCount:doc.data().answerCount,
          created: doc.data().created,
        }
        return questions.push(question);
      }, );
      lastVisible = snapshot.docs[snapshot.docs.length-1];
      console.log("last", lastVisible);
      dispatch({
        type: 'INIT',
        questions
      });
    }, );
}
export const scrollFetchQuestions = (questionData) => async (dispatch) => {
  if(questionData){
    dispatch({
      type: 'LOADING',
      payload:true
    });
    const lastCreated = await questionData.created
    const questions = [];
    
    //質問詳細ページで再読込してトップページに戻るとquestionDataを取得する前に呼び出されエラーになるので追加
    if(!lastCreated){
      return
    }
    
    await db.collection('questions').where("created","<",lastCreated).orderBy('created','desc').limit(10).get()
      .then(snapshot => {
        snapshot.docs.map(doc => {
          //allitemsにデータを代入
          const question = {
            name: doc.data().name,
            title: doc.data().title,
            question: doc.data().question,
            questionId: doc.id,
            userId: doc.data().userId,
            goodCount: doc.data().goodCount,
            answerCount:doc.data().answerCount,
            created: doc.data().created,
          }
          return questions.push(question);
        }, );

        dispatch({
          type: 'SCROLL_FETCH_QUESTIONS',
          questions
        });

        dispatch({
          type: 'LOADING',
          payload:false
        });
      }, );
  }
}

export const createQuestion = (formValues, auth) => async (dispatch) => {

  let questionId;
  //データベースに保存
  await db.collection('questions').add({
      ...formValues,
      userId: auth.userId,
      name: auth.name,
      goodCount: 0,
      answerCount:0,
      created: firebase.firestore.FieldValue.serverTimestamp()
    }).then(doc => {
      console.log(`${doc.id}をDBに保存した`);
      questionId = doc.id
    })
    .catch(error => {
      console.log(error);
    });

  db.collection('users').doc(auth.userId).collection('questions').doc(questionId).set({
      ...formValues,
      goodCount: 0,
      answerCount:0,
      questionId: questionId,
      created: firebase.firestore.FieldValue.serverTimestamp()
    }).then(doc => {
      console.log(`DBに保存した`);
    })
    .catch(error => {
      console.log(error);
    });
}

export const createAnswer = (formValues, questionId, auth) => async (dispatch) => {
  let answerId;
  await db.collection('questions').doc(questionId).collection('answers').add({
      ...formValues,
      userId:auth.userId,
      name:auth.name,
      questionId: questionId,
      goodCount:0,
      created: firebase.firestore.FieldValue.serverTimestamp()
    }).then(doc => {
      console.log(`${doc.id}をDBに保存した`);
      answerId = doc.id
    })
    .catch(error => {
      console.log(error);
    });

  db.collection('users').doc(auth.userId).collection('answers').doc(answerId).set({
      ...formValues,
      questionId: questionId,
      answerId: answerId,
      goodCount:0,
      created: firebase.firestore.FieldValue.serverTimestamp()
    }).then(doc => {
      console.log(`${doc.id}をDBに保存した`);
    })
    .catch(error => {
      console.log(error);
    });
  
  //投稿データに総回答数を保存している
  var washingtonRef = db.collection('questions').doc(questionId);
  washingtonRef.update({
    answerCount: firebase.firestore.FieldValue.increment(1)
  });
  var washingtonRef = db.collection('users').doc(auth.userId).collection('questions').doc(questionId);
  washingtonRef.update({
    answerCount: firebase.firestore.FieldValue.increment(1)
  });

}

export const fetchAnswers = (id) => (dispatch) => {
  const answers = [];
  db.collection('questions').doc(id).collection('answers').orderBy('created').get()
    .then(snapshot => {
      snapshot.docs.map(doc => {
        //allitemsにデータを代入
        const answer = {
          name: doc.data().name,
          answer: doc.data().answer,
          answerId: doc.id,
          questionId:doc.data().questionId,
          goodCount: doc.data().goodCount,
          userId: doc.data().userId,
        }
        return answers.unshift(answer);
      }, );
      
      dispatch({
        type: 'LOAD_ANSWER',
        answers
      });
    }, );
}

export const resetAnswer = () => dispatch => {
  const answers = {};
  dispatch({
    type: 'RESET_ANSWER',
    answers
  });
}

//詳細ページで再読み込みする際、これがないとページが表示されない
export const fetchQuestion = (id) => (dispatch) => {
  console.log(firebase.auth().currentUser)
  db.collection('questions').doc(id).get()
    .then(snapshot => {
      //allitemsにデータを代入
      const payload = {
        name: snapshot.data().name,
        title: snapshot.data().title,
        question: snapshot.data().question,
        goodCount:snapshot.data().goodCount,
        userId:snapshot.data().userId,
        questionId: id
      }

      dispatch({
        type: 'FETCH_QUESTION',
        payload: payload
      });

    }, );
}

//firebaseにユーザー情報を登録し、そのユーザーでログインして、ログインユーザー情報をstoreに保存している
export const signUp = formValues => async (dispatch) => {
  //ユーザー登録
  await firebase.auth().createUserWithEmailAndPassword(formValues.mail, formValues.password).catch(function (error) {
    console.log('error')
  });

  //ユーザーログイン
  await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(function () {
      firebase.auth().signInWithEmailAndPassword(formValues.mail, formValues.password).catch(function (error) {
        // Handle Errors here.
      })
    }).catch(function (error) {
      // Handle Errors here.
      console.log(error)
    });

    // 作成したユーザーにログインして、updateProfileを使用して、ユーザー名をfirestoreに保存している。登録時にユーザー名を保存する方法がわからないためこの方法をとっている。
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
       user.updateProfile({
          displayName: formValues.name,
        }).then(function() {

          //storeにユーザー情報を保存
          const name = user.displayName
          const userId = user.uid;
          dispatch({
            type: 'SIGN_IN',
            name:name,
            userId:userId 
          });
      
          //firestoreにユーザーIDを保存
          db.collection('users').doc(userId).set({
              userId: userId
            }).then(doc => {})
            .catch(error => {
              console.log(error);
            });
        }).catch(function(error) {
        });

      } else {
        console.log("error")
      }
    });

}

//既にログイン済みの人のログイン情報をstoreに保存している
export const signInAction = () => (dispatch) => {

  // firebaseからログイン中のユーザー情報を取得している
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      dispatch({
        type: 'SIGN_IN',
        userId: user.uid,
        name:user.displayName
      });
    } else {
      console.log("error")
    }
  });
};


//ログイン処理
//ログインするとonAuthStateChangedが自動的に呼び出されstoreに保存される
//onAuthStateChangedはdidmountなどで一度呼び出した後じゃないと自動呼び出しされないようだ
export const loginAction = (formValues) => async (dispatch) => {
  //LOCALに設定することでログイン状態を永続化している
  await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(function () {
      firebase.auth().signInWithEmailAndPassword(formValues.mail, formValues.password).catch(function (error) {})
    }).catch(function (error) {
      console.log(error)
    });

};


export const signOutAction = () => (dispatch) => {

  firebase.auth().signOut().then(function () {
    dispatch({
      type: 'SIGN_OUT'
    })
  }).catch(function (error) {
    console.log(error)
  });

};


export const fetchMyQuestions = (userId) => (dispatch) => {
  const questions = [];
  
  db.collection('users').doc(userId).collection('questions').orderBy('created').get()
    .then(snapshot => {
      snapshot.docs.map(doc => {
        //allitemsにデータを代入
        const question = {
          name: doc.data().name,
          title: doc.data().title,
          question: doc.data().question,
          questionId: doc.data().questionId,
          goodCount: doc.data().goodCount,
          answerCount:doc.data().answerCount,
        }
        return questions.unshift(question);

        //リデューサー
      }, );
      dispatch({
        type: 'FETCH_MY_QUESTIONS',
        payload: questions
      });
    }, );
}

export const fetchMyAnswers = (userId) => (dispatch) => {
  const answers = [];

  db.collection('users').doc(userId).collection('answers').orderBy('created').get()
    .then(snapshot => {
      snapshot.docs.map(doc => {
        //allitemsにデータを代入
        const answer = {
          answer: doc.data().answer,
          questionId: doc.data().questionId,
          docId: doc.id,
          goodCount:doc.data().goodCount,
        }
        return answers.unshift(answer);

        //リデューサー
      }, );
      dispatch({
        type: 'FETCH_MY_ANSWERS',
        payload: answers
      });
    }, );
}


export const questionGoodCount = (postData) => async (dispatch) => {

  //firebaseのgoodCountに1足している
  var washingtonRef = db.collection('questions').doc(postData.questionId);
  washingtonRef.update({
    goodCount: firebase.firestore.FieldValue.increment(1)
  });
  var washingtonRef = db.collection('users').doc(postData.userId).collection('questions').doc(postData.questionId);
  washingtonRef.update({
    goodCount: firebase.firestore.FieldValue.increment(1)
  });


  let goodCount = postData.goodCount + 1;

  const newdata = {
    ...postData,
    goodCount: goodCount
  }

  dispatch({
    type: 'QUESTION_ADD_GOODCOUNT',
    payload: newdata,
    questionId: postData.questionId,
  });
}

export const answerGoodCount = (postData) => async (dispatch) => {

  //firebaseのgoodCountに1足している
  var washingtonRef = db.collection('questions').doc(postData.questionId).collection('answers').doc(postData.answerId);
  washingtonRef.update({
    goodCount: firebase.firestore.FieldValue.increment(1)
  });
  var washingtonRef = db.collection('users').doc(postData.userId).collection('answers').doc(postData.answerId);
  washingtonRef.update({
    goodCount: firebase.firestore.FieldValue.increment(1)
  });


  let goodCount = postData.goodCount + 1;

  const newdata = {
    ...postData,
    goodCount: goodCount
  }

  dispatch({
    type: 'ANSWER_ADD_GOODCOUNT',
    payload: newdata,
    answerId: postData.answerId,
  });
}

export const setCurrentPage = (pageNumber) => async (dispatch) => {
  if (!pageNumber){
    pageNumber = 1;
  }
  
  dispatch({
    type: 'SET_CURRENT_PAGE',
    payload: pageNumber,
  });
}


export const createResponse = (formValues, questionId, answerId,auth) => async (dispatch) => {
  
  await db.collection('questions').doc(questionId).collection('answers').doc(answerId).collection('responses').add({
      ...formValues,
      name:auth.name,
      created: firebase.firestore.FieldValue.serverTimestamp()
    }).then(doc => {
      console.log(`${doc.id}をDBに保存した`);
    })
    .catch(error => {
      console.log(error);
    });
}

export const fetchResponses = (questionId,answerId) => (dispatch) => {
  const responses = [];
  db.collection('questions').doc(questionId).collection('answers').doc(answerId).collection('responses').orderBy('created').get()
    .then(snapshot => {
      snapshot.docs.map(doc => {
        //allitemsにデータを代入
        const response = {
          name: doc.data().name,
          response: doc.data().response,
        }
        responses.push(response);
      },);
      console.log(responses)
      dispatch({
        type: 'FETCH_RESPONSES',
        payload:responses,
        answerId:answerId
      });
    }, );
}