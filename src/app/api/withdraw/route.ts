import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, transactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, generateId } from '@/lib/auth';
import { createPaypalPayout } from '@/lib/paypal';


export async function POST(req: NextRequest) {

  try {

    const authUser = await getCurrentUser();


    if (!authUser) {

      return NextResponse.json(
        {
          error:'Não autenticado'
        },
        {
          status:401
        }
      );

    }



    const body = await req.json();


    const {
      amount,
      paypalEmail
    } = body;



    const value = Number(amount);



    if(!value || value <= 0){

      return NextResponse.json(
        {
          error:'Valor inválido'
        },
        {
          status:400
        }
      );

    }



    if(!paypalEmail){

      return NextResponse.json(
        {
          error:'E-mail PayPal obrigatório'
        },
        {
          status:400
        }
      );

    }



    const [user] =
      await db
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
        {
          error:'Usuário não encontrado'
        },
        {
          status:404
        }
