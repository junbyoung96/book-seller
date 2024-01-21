async function f(){
    const promise = new Promise((resolve,reject) => {
        setTimeout(() => {
            console.log(1);
        }, 1000);
    });
    return 2;
}


let a = f();
console.log(a);