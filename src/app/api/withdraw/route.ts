import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, transactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, generateId } from '@/lib/auth';


export async function POST(req: NextRequest) {

  try {

    const authUser = await getCurrentUser();


    if (!authUser) {

      return NextResponse.json(
        { error: 'Não autenticado' },
        { status:401 }
      );

    }


    const body = await req.json();


    const amount = Number(body.amount);
    const paypalEmail = body.paypalEmail;



    if (!amount || amount <= 0) {

      return NextResponse.json(
        { error:'Valor inválido' },
        { status:400 }
      );

    }



    if (!paypalEmail) {

      return NextResponse.json(
        { error:'Email PayPal obrigatório' },
        { status:400 }
      );

    }



    const [user] = await db
      .select()
      .from(users)
      .where(
        eq(users.id, authUser.id)
      );



    if (!user) {

      return NextResponse.json(
        { error:'Usuário não encontrado' },
        { status:404 }
      );

    }



    if (user.balance < amount) {

      return NextResponse.json(
        { error:'Saldo insuficiente' },
        { status:400 }
      );

    }



    /*
      AQUI ENTRA O PAYPAL PAYOUTS

      Depois que configurar:
      await createPayPalPayout({
        email: paypalEmail,
        amount
      });

    */



    const newBalance =
      Number(
        (user.balance - amount)
        .toFixed(2)
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
        eq(users.id,user.id)
      );




    await db.insert(transactions)
    .values({

      id:generateId(),

      userId:user.id,

      type:'withdrawal',

      status:'pending',

      amount,

      pixKey:null,

      pixName:paypalEmail,

      pixCpf:null,

      description:
        `Saque PayPal $${amount}`

    });



    return NextResponse.json({

      success:true,

      newBalance

    });



  } catch(error) {


    console.error(
      'Withdraw error:',
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
