'use client';

import { useState } from 'react';

interface WithdrawModalProps {
  balance:number;
  onClose:()=>void;
  onSuccess:(newBalance:number)=>void;
}


export default function WithdrawModal({
  balance,
  onClose,
  onSuccess
}:WithdrawModalProps){


const [amount,setAmount]=useState('');
const [paypalEmail,setPaypalEmail]=useState('');
const [loading,setLoading]=useState(false);
const [error,setError]=useState('');
const [success,setSuccess]=useState(false);



async function handleWithdraw(e:React.FormEvent){

e.preventDefault();


const value=Number(amount);


if(!value || value<=0){
setError('Valor inválido');
return;
}


if(value>balance){
setError('Saldo insuficiente');
return;
}


if(!paypalEmail){
setError('Informe seu PayPal');
return;
}


setLoading(true);
setError('');


try{


const res=await fetch('/api/withdraw',{
method:'POST',
headers:{
'Content-Type':'application/json'
},
credentials:'include',
body:JSON.stringify({

amount:value,
paypalEmail

})

});


const data=await res.json();



if(!res.ok){

setError(data.error || 'Erro no saque');
return;

}



setSuccess(true);

onSuccess(data.newBalance);



}catch{

setError('Erro de conexão');


}finally{

setLoading(false);

}



}



return (

<div className="modal-overlay">

<div className="modal-box">


<h2>
💸 Saque PayPal
</h2>


{
success ? (

<div>

<h3>
✅ Saque enviado
</h3>


<p>
O pagamento será enviado para:
</p>


<strong>
{paypalEmail}
</strong>


<button
className="btn-primary"
onClick={onClose}
>
Fechar
</button>


</div>


):(


<form onSubmit={handleWithdraw}>


<p>
Saldo:
</p>


<h2>
R$ {balance.toFixed(2)}
</h2>



<input
className="input-field"
type="number"
step="0.01"
placeholder="Valor"
value={amount}
onChange={e=>setAmount(e.target.value)}
/>



<input
className="input-field"
type="email"
placeholder="Email PayPal"
value={paypalEmail}
onChange={e=>setPaypalEmail(e.target.value)}
/>



{
error &&
<p style={{color:'red'}}>
{error}
</p>
}



<button
className="btn-primary"
disabled={loading}
>

{
loading
?'Enviando...'
:'Sacar'
}


</button>



<button
type="button"
onClick={onClose}
>
Cancelar
</button>



</form>


)


}


</div>

</div>

)

  }
