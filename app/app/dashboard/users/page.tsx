"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import axios from "axios";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "react-hot-toast";

interface User {
  id?: string;
  _id?: string;
  username: string;
  email: string;
  role: string;
}

const UsersPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (user && user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    if (user?.role === "admin") {
      fetchUsers();
    }
  }, [user, authLoading, router]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users`, {
        withCredentials: true,
      });
      // Normalize user IDs - handle both _id and id
      const normalizedUsers = (response.data.users || []).map((u: any) => ({
        ...u,
        id: u.id || u._id || u.id,
      }));
      setUsers(normalizedUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(error.response?.data?.error || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;

    try {
      await axios.post(
        `${API_URL}/api/auth/register`,
        { username, email, password, role },
        { withCredentials: true }
      );
      toast.success("User created successfully");
      setCreateDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/users/${userId}`, {
        withCredentials: true,
      });
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete user");
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;

    const userId = editingUser.id || editingUser._id || "";
    if (!userId) {
      toast.error("Invalid user ID");
      return;
    }

    try {
      const updateData: any = { username, email, role };
      if (password && password.trim()) {
        updateData.password = password;
      }

      await axios.patch(
        `${API_URL}/api/users/${userId}`,
        updateData,
        { withCredentials: true }
      );
      toast.success("User updated successfully");
      setEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update user");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <div className="p-6 bg-[#0f0f0f] min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white">Users</h1>
          <p className="text-gray-400">Manage all users in the system</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-gray-800/50">
                <TableHead className="text-gray-300">Name</TableHead>
                <TableHead className="text-gray-300">Email</TableHead>
                <TableHead className="text-gray-300">Role</TableHead>
                <TableHead className="text-right text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow className="border-gray-800">
                  <TableCell colSpan={4} className="text-center text-gray-400">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const userId = u.id || u._id || "";
                  return (
                    <TableRow key={userId} className="border-gray-800 hover:bg-gray-800/50">
                      <TableCell className="font-medium text-white">{u.username}</TableCell>
                      <TableCell className="text-gray-300">{u.email}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-cyan-600/20 px-2.5 py-0.5 text-xs font-medium text-cyan-500 capitalize">
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(u)}
                            className="text-gray-400 hover:text-white hover:bg-gray-800"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(userId)}
                            disabled={!userId || userId === user?.id}
                            className="text-gray-400 hover:text-red-500 hover:bg-gray-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle className="text-white">Create User</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a new user to the system. All fields are required.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="johndoe"
                  required
                  minLength={3}
                  className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role" className="text-white">Role</Label>
                <select
                  id="role"
                  name="role"
                  required
                  className="flex h-10 w-full rounded-md border border-gray-800 bg-[#0f0f0f] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
                >
                  <option value="">Select role</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} className="border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white">
                Cancel
              </Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
          <form onSubmit={handleEditUser}>
            <DialogHeader>
              <DialogTitle className="text-white">Edit User</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update user information. Leave password blank to keep current password.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-username" className="text-white">Username</Label>
                <Input
                  id="edit-username"
                  name="username"
                  placeholder="johndoe"
                  required
                  minLength={3}
                  defaultValue={editingUser?.username || ""}
                  className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email" className="text-white">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  defaultValue={editingUser?.email || ""}
                  className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password" className="text-white">Password (leave blank to keep current)</Label>
                <Input
                  id="edit-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  minLength={6}
                  className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role" className="text-white">Role</Label>
                <select
                  id="edit-role"
                  name="role"
                  required
                  defaultValue={editingUser?.role || ""}
                  className="flex h-10 w-full rounded-md border border-gray-800 bg-[#0f0f0f] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
                >
                  <option value="">Select role</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setEditDialogOpen(false);
                setEditingUser(null);
              }} className="border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white">
                Cancel
              </Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;

