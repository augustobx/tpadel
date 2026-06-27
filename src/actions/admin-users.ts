'use server';

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateUserAdmin(userId: string, data: {
    name: string;
    lastName: string;
    phone: string;
    category: string;
    isActive: boolean;
    password?: string;
}) {
    try {
        const updateData: any = {
            name: data.name,
            lastName: data.lastName,
            phone: data.phone,
            category: data.category,
            isActive: data.isActive,
        };

        if (data.password && data.password.trim() !== "") {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        revalidatePath("/admin/usuarios");
        return { success: true };
    } catch (error) {
        console.error("Error updating user:", error);
        return { success: false, error: "Error al actualizar el usuario." };
    }
}
