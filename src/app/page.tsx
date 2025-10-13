import prisma from "@/lib/db";


const page = async () => {
  const users = await prisma.user.findMany();
  return <div>page
    {users.map((user) => (
      <div key={user.id}>{user.name}</div>
    ))}

    </div>
};

export default page;