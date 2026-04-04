import { useEffect, useState } from "react";
import {
  getProducts,
  updateProduct,
  resetProducts,
  downloadProducts,
  getPrompts,
  updatePrompt,
  resetPrompts,
  downloadPrompts,
} from "@/services/siorinApi";
import type { Product, Prompt } from "@/types/siorin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Download,
  RotateCcw,
  Package,
  FileText,
  Edit,
  Save,
  Loader2,
} from "lucide-react";

export default function SiorinAdmin() {
  const [activeTab, setActiveTab] = useState<"products" | "prompts">("products");

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productSaving, setProductSaving] = useState(false);
  const [resetProductsAlertOpen, setResetProductsAlertOpen] = useState(false);
  const [productsDownloading, setProductsDownloading] = useState(false);

  // Prompts state
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(true);
  const [editingPromptKey, setEditingPromptKey] = useState<string | null>(null);
  const [promptSaving, setPromptSaving] = useState<Record<string, boolean>>({});
  const [resetPromptsAlertOpen, setResetPromptsAlertOpen] = useState(false);
  const [promptsDownloading, setPromptsDownloading] = useState(false);

  // Load products
  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      toast.error(`Failed to load products: ${(error as Error).message}`);
    } finally {
      setProductsLoading(false);
    }
  };

  // Load prompts
  const loadPrompts = async () => {
    try {
      setPromptsLoading(true);
      const data = await getPrompts();
      setPrompts(data);
    } catch (error) {
      toast.error(`Failed to load prompts: ${(error as Error).message}`);
    } finally {
      setPromptsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadPrompts();
  }, []);

  // Product handlers
  const handleEditProduct = (product: Product) => {
    setSelectedProduct({ ...product });
    setProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!selectedProduct) return;

    try {
      setProductSaving(true);
      await updateProduct(selectedProduct.id, selectedProduct);
      toast.success("Product updated successfully!");
      setProductDialogOpen(false);
      loadProducts();
    } catch (error) {
      toast.error(`Failed to update product: ${(error as Error).message}`);
    } finally {
      setProductSaving(false);
    }
  };

  const handleResetProducts = async () => {
    try {
      const result = await resetProducts();
      toast.success(result.message);
      setResetProductsAlertOpen(false);
      loadProducts();
    } catch (error) {
      toast.error(`Failed to reset products: ${(error as Error).message}`);
    }
  };

  const handleDownloadProducts = async () => {
    try {
      setProductsDownloading(true);
      await downloadProducts();
      toast.success("Products downloaded! Update default_products.py with this file.");
    } catch (error) {
      toast.error(`Failed to download products: ${(error as Error).message}`);
    } finally {
      setProductsDownloading(false);
    }
  };

  // Prompt handlers
  const handleSavePrompt = async (promptKey: string, promptText: string) => {
    try {
      setPromptSaving((prev) => ({ ...prev, [promptKey]: true }));
      await updatePrompt(promptKey, promptText);
      toast.success("Prompt updated successfully!");
      setEditingPromptKey(null);
      loadPrompts();
    } catch (error) {
      toast.error(`Failed to update prompt: ${(error as Error).message}`);
    } finally {
      setPromptSaving((prev) => ({ ...prev, [promptKey]: false }));
    }
  };

  const handleResetPrompts = async () => {
    try {
      const result = await resetPrompts();
      toast.success(result.message);
      setResetPromptsAlertOpen(false);
      loadPrompts();
    } catch (error) {
      toast.error(`Failed to reset prompts: ${(error as Error).message}`);
    }
  };

  const handleDownloadPrompts = async () => {
    try {
      setPromptsDownloading(true);
      await downloadPrompts();
      toast.success("Prompts downloaded! Update default_prompts.py with this file.");
    } catch (error) {
      toast.error(`Failed to download prompts: ${(error as Error).message}`);
    } finally {
      setPromptsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Siorin Admin Settings</h1>
        <p className="text-muted-foreground">
          Manage products and prompts for Siorin agent
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "products" | "prompts")}>
        <TabsList>
          <TabsTrigger value="products">
            <Package className="mr-2 h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="prompts">
            <FileText className="mr-2 h-4 w-4" />
            Prompts
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Products Management</CardTitle>
                  <CardDescription>
                    View, edit, reset, and download products data
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownloadProducts}
                    disabled={productsDownloading}
                  >
                    {productsDownloading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setResetProductsAlertOpen(true)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Subcategory</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.sku}</Badge>
                          </TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>{product.subcategory}</TableCell>
                          <TableCell>{product.price}</TableCell>
                          <TableCell>
                            <Badge variant={product.is_active ? "default" : "secondary"}>
                              {product.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Prompts Management</CardTitle>
                  <CardDescription>
                    View, edit, reset, and download prompts data
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownloadPrompts}
                    disabled={promptsDownloading}
                  >
                    {promptsDownloading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setResetPromptsAlertOpen(true)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {promptsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-40 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {prompts.map((prompt) => (
                    <Card key={prompt.prompt_key}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{prompt.prompt_name}</CardTitle>
                            <CardDescription className="font-mono text-xs">
                              Key: {prompt.prompt_key}
                            </CardDescription>
                            <CardDescription>{prompt.description}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{prompt.prompt_type}</Badge>
                            <Badge variant={prompt.is_active ? "default" : "secondary"}>
                              {prompt.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`prompt-${prompt.prompt_key}`}>Prompt Text</Label>
                          {editingPromptKey === prompt.prompt_key ? (
                            <div className="space-y-2">
                              <Textarea
                                id={`prompt-${prompt.prompt_key}`}
                                value={prompt.prompt_text}
                                onChange={(e) => {
                                  const updated = prompts.map((p) =>
                                    p.prompt_key === prompt.prompt_key
                                      ? { ...p, prompt_text: e.target.value }
                                      : p
                                  );
                                  setPrompts(updated);
                                }}
                                rows={10}
                                className="font-mono text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleSavePrompt(prompt.prompt_key, prompt.prompt_text)
                                  }
                                  disabled={promptSaving[prompt.prompt_key]}
                                >
                                  {promptSaving[prompt.prompt_key] ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                  )}
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingPromptKey(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="rounded-md bg-muted p-4">
                                <pre className="whitespace-pre-wrap font-mono text-sm">
                                  {prompt.prompt_text}
                                </pre>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingPromptKey(prompt.prompt_key)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Edit Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Make changes to the product. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={selectedProduct.name}
                    onChange={(e) =>
                      setSelectedProduct({ ...selectedProduct, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={selectedProduct.sku}
                    onChange={(e) =>
                      setSelectedProduct({ ...selectedProduct, sku: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={selectedProduct.category}
                    onChange={(e) =>
                      setSelectedProduct({ ...selectedProduct, category: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    value={selectedProduct.subcategory}
                    onChange={(e) =>
                      setSelectedProduct({ ...selectedProduct, subcategory: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    value={selectedProduct.price}
                    onChange={(e) =>
                      setSelectedProduct({ ...selectedProduct, price: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_type">Vehicle Type</Label>
                  <Input
                    id="vehicle_type"
                    value={selectedProduct.vehicle_type}
                    onChange={(e) =>
                      setSelectedProduct({ ...selectedProduct, vehicle_type: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={selectedProduct.description}
                  onChange={(e) =>
                    setSelectedProduct({ ...selectedProduct, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={selectedProduct.is_active}
                    onCheckedChange={(checked) =>
                      setSelectedProduct({ ...selectedProduct, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_realtime_tracking"
                    checked={selectedProduct.is_realtime_tracking}
                    onCheckedChange={(checked) =>
                      setSelectedProduct({ ...selectedProduct, is_realtime_tracking: checked })
                    }
                  />
                  <Label htmlFor="is_realtime_tracking">Real-time Tracking</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="can_shutdown_engine"
                    checked={selectedProduct.can_shutdown_engine}
                    onCheckedChange={(checked) =>
                      setSelectedProduct({ ...selectedProduct, can_shutdown_engine: checked })
                    }
                  />
                  <Label htmlFor="can_shutdown_engine">Can Shutdown Engine</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProductDialogOpen(false)}
              disabled={productSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveProduct} disabled={productSaving}>
              {productSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Products Alert */}
      <AlertDialog open={resetProductsAlertOpen} onOpenChange={setResetProductsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Products to Defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will DELETE all existing products and replace them with the default values
              from the hardcoded Python file. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetProducts}>
              Reset Products
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Prompts Alert */}
      <AlertDialog open={resetPromptsAlertOpen} onOpenChange={setResetPromptsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Prompts to Defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will DELETE all existing prompts and replace them with the default values
              from the hardcoded Python file. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPrompts}>
              Reset Prompts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
