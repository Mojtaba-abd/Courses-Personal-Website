"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import axios from "axios";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Users</h1>
          <p className="text-muted-foreground">Manage all users in the system</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const userId = u.id || u._id || "";
                  return (
                    <TableRow key={userId}>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(userId)}
                          disabled={!userId || userId === user?.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
              <DialogDescription>
                Add a new user to the system. All fields are required.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="johndoe"
                  required
                  minLength={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select role</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;

