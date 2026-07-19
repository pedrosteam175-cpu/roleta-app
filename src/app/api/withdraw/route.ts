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
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, transactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, generateId } from '@/lib/auth';
import { createPayPalPayout } from '@/lib/paypal';


export async function POST(req: NextRequest) {

  try {


    const authUser = await getCurrentUser();


    if (!authUser) {

      return NextResponse.json(
        {error:'Não autenticado'},
        {status:401}
      );

    }



    const body = await req.json();


    const amount = Number(body.amount);
    const paypalEmail = body.paypalEmail;



    if(!amount || amount <= 0){

      return NextResponse.json(
        {error:'Valor inválido'},
        {status:400}
      );

    }



    if(!paypalEmail){

      return NextResponse.json(
        {error:'Email PayPal obrigatório'},
        {status:400}
      );

    }



    const [user] = await db
    .select()
    .from(users)
    .where(
      eq(
        users.id,
        authUser.id
      )
    );



    if(!user){

      return NextResponse.json(
        {error:'Usuário não encontrado'},
        {status:404}
      );

    }



    if(user.balance < amount){

      return NextResponse.json(
        {error:'Saldo insuficiente'},
        {status:400}
      );

    }



    /*
      ENVIA PAYPAL
    */

    const payout = await createPayPalPayout({

      email:paypalEmail,

      amount,

      note:'Saque Roleta da Sorte'

    });



    const newBalance =
      Number(
        (
          user.balance - amount
        ).toFixed(2)
      );



    await db
    .update(users)
    .set({

      balance:newBalance,

      totalWithdrawn:
        user.totalWithdrawn + amount,

      updatedAt:new Date()

    })
    .where(
      eq(
        users.id,
        user.id
      )
    );





    await db
    .insert(transactions)
    .values({

      id:generateId(),

      userId:user.id,

      type:'withdrawal',

      status:'completed',

      amount,

      paypalEmail,

      paypalBatchId:
        payout.batchId,

      description:
        `Saque PayPal $${amount}`

    });



    return NextResponse.json({

      success:true,

      newBalance

    });



  }catch(error){


    console.error(
      'WITHDRAW ERROR',
      error
    );


    return NextResponse.json(
      {
        error:'Erro ao processar saque'
      },
      {
        status:500
      }
    );


  }


}
export const transactions = pgTable('transactions', {

  id: text('id').primaryKey(),

  userId: text('user_id')
    .notNull()
    .references(() => users.id),


  type: transactionTypeEnum('type')
    .notNull(),


  status: transactionStatusEnum('status')
    .notNull()
    .default('pending'),


  amount: real('amount')
    .notNull(),



  // PIX (mantém compatibilidade)
  pixKey: text('pix_key'),
  pixName: text('pix_name'),
  pixCpf: text('pix_cpf'),



  // PAYPAL NOVO
  paypalEmail: text('paypal_email'),

  paypalBatchId: text('paypal_batch_id'),



  // ASAAS antigo
  asaasPaymentId: text('asaas_payment_id'),
  asaasPixCode: text('asaas_pix_code'),
  asaasPixQrCode: text('asaas_pix_qr_code'),



  description:text('description'),


  createdAt: timestamp('created_at')
    .notNull()
    .defaultNow(),


  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow(),

});
