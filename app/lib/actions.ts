"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import postgres from "postgres"
import { signIn } from "@/auth"
import { AuthError } from "next-auth"

// Creating Invoice
// 1.Create a form to capture the user's input.
// 2.Create a Server Action and invoke it from the form.
// 3.Inside your Server Action, extract the data from the formData object.
// 4.Validate and prepare the data to be inserted into your database.
// 5.Insert the data and handle any errors.
// 6.Revalidate the cache and redirect the user back to invoices page.

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" })
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: "Please select a customer.",
    }),
    amount: z.coerce
        .number()
        .gt(0, { message: "Please enter an amount greater than $0." }),
    status: z.enum(["pending", "paid"], {
        invalid_type_error: "Please select an invoice status.",
    }),
    date: z.string(),
})

export type State = {
    errors?: {
        customerId?: string[]
        amount?: string[]
        status?: string[]
    }
    message?: string | null
}

const CreateInvoice = FormSchema.omit({ id: true, date: true })

const UpdateInvoice = FormSchema.omit({ id: true, date: true })

export async function createInvoice(prevState: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status"),
    })

    // If form validation fails, return erros early. Otherwise, continue.
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Create invoice.",
        }
    }
    // Prepare data for insertion inot the database
    const { customerId, amount, status } = validatedFields.data
    // in cents to avoid floating-point erros
    const amountInCents = amount * 100
    // date-format: YYYY-MM-DD
    const date = new Date().toISOString().split("T")[0]

    try {
        await sql`INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `
    } catch (error) {
        console.error(error)
        return {
            message: "Database Error: Failed to Create Invoice.",
        }
    }

    // nextjs store the route segments in cache for smooth navigation
    // since we are updating the data displayed in the invoices route we need to clear this cached and trigger new request to server so for this we use revalidatePath
    // once the database gets updated path will be revalidated and fresh data will be fetched from the server
    revalidatePath("/dashboard/invoices")
    redirect("/dashboard/invoices")
}

export async function updateInvoice(
    id: string,
    prevState: State,
    formData: FormData
) {
    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status"),
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Update Invoice.",
        }
    }

    const { customerId, amount, status } = validatedFields.data
    const amountInCents = amount * 100

    try {
        await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount=${amountInCents}, status = ${status}
        WHERE id = ${id}
        `
    } catch (error) {
        console.log(error)
        return {
            message: "Database Error: Failed to Create Invoice.",
        }
    }
    revalidatePath("/dashboard/invoices")
    redirect("/dashboard/invoices")
}

export async function deleteInvoice(id: string) {
    await sql`DELETE FROM invoices WHERE id = ${id}`
    revalidatePath("/dashboard/invoices")
}

// Action logic for login form
export async function authenticate(
    prevState: string | undefined,
    formData: FormData
) {
    try {
        await signIn("credentials", formData)
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return "Invalid credentials."
                default:
                    return "Something went wrong."
            }
        }
        throw error
    }
}
