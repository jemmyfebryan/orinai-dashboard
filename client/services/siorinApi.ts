import type {
  DashboardResponse,
  ProductsResponse,
  Product,
  UpdateProductResponse,
  ResetProductsResponse,
  PromptsResponse,
  Prompt,
  UpdatePromptResponse,
  ResetPromptsResponse,
  ContactItem,
  ChatMessageItem,
  ToggleHumanTakeoverResponse,
} from "@/types/siorin";

// Dashboard API
export async function getSiorinDashboard(): Promise<DashboardResponse> {
  try {
    const res = await fetch('/siorin/dashboard', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Siorin dashboard: ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching Siorin dashboard:', error);
    throw new Error(`Error fetching Siorin dashboard: ${(error as Error).message}`);
  }
}

// Products Admin API
export async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch('/siorin/admin/products', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.statusText}`);
    }

    const data: ProductsResponse = await res.json();
    if (data.success) {
      return data.products;
    }
    throw new Error('Failed to fetch products');
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function updateProduct(productId: number, productData: Partial<Product>): Promise<UpdateProductResponse> {
  try {
    const res = await fetch(`/siorin/admin/products/${productId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (!res.ok) {
      throw new Error(`Failed to update product: ${res.statusText}`);
    }

    const data: UpdateProductResponse = await res.json();
    if (data.success) {
      return data;
    }
    throw new Error(data.message || 'Failed to update product');
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

export async function resetProducts(): Promise<ResetProductsResponse> {
  try {
    const res = await fetch('/siorin/admin/products/reset', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to reset products: ${res.statusText}`);
    }

    const data: ResetProductsResponse = await res.json();
    if (data.success) {
      return data;
    }
    throw new Error(data.message || 'Failed to reset products');
  } catch (error) {
    console.error('Error resetting products:', error);
    throw error;
  }
}

export async function downloadProducts(): Promise<void> {
  try {
    const res = await fetch('/siorin/admin/products/download', {
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Failed to download products: ${res.statusText}`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'default_products.py';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading products:', error);
    throw error;
  }
}

// Prompts Admin API
export async function getPrompts(): Promise<Prompt[]> {
  try {
    const res = await fetch('/siorin/admin/prompts', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch prompts: ${res.statusText}`);
    }

    const data: PromptsResponse = await res.json();
    if (data.success) {
      return data.prompts;
    }
    throw new Error('Failed to fetch prompts');
  } catch (error) {
    console.error('Error fetching prompts:', error);
    throw error;
  }
}

export async function updatePrompt(promptKey: string, promptText: string): Promise<UpdatePromptResponse> {
  try {
    const res = await fetch(`/siorin/admin/prompts/${encodeURIComponent(promptKey)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt_text: promptText }),
    });

    if (!res.ok) {
      throw new Error(`Failed to update prompt: ${res.statusText}`);
    }

    const data: UpdatePromptResponse = await res.json();
    if (data.success) {
      return data;
    }
    throw new Error(data.message || 'Failed to update prompt');
  } catch (error) {
    console.error('Error updating prompt:', error);
    throw error;
  }
}

export async function resetPrompts(): Promise<ResetPromptsResponse> {
  try {
    const res = await fetch('/siorin/admin/prompts/reset', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to reset prompts: ${res.statusText}`);
    }

    const data: ResetPromptsResponse = await res.json();
    if (data.success) {
      return data;
    }
    throw new Error(data.message || 'Failed to reset prompts');
  } catch (error) {
    console.error('Error resetting prompts:', error);
    throw error;
  }
}

export async function downloadPrompts(): Promise<void> {
  try {
    const res = await fetch('/siorin/admin/prompts/download', {
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Failed to download prompts: ${res.statusText}`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'default_prompts.py';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading prompts:', error);
    throw error;
  }
}

// Chat History API
export async function getContacts(): Promise<ContactItem[]> {
  try {
    const res = await fetch('/siorin/admin/contacts', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch contacts: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.success) {
      return data.contacts;
    }
    throw new Error('Failed to fetch contacts');
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
}

export async function getChatHistory(customerId: number): Promise<ChatMessageItem[]> {
  try {
    const res = await fetch(`/siorin/admin/contacts/${customerId}/chat-history`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 404) {
      throw new Error('Customer not found');
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch chat history: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.success) {
      return data.messages;
    }
    throw new Error('Failed to fetch chat history');
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
}

export async function toggleHumanTakeover(customerId: number): Promise<ToggleHumanTakeoverResponse> {
  try {
    const res = await fetch(`/siorin/admin/contacts/${customerId}/human-takeover`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 404) {
      throw new Error('Customer not found');
    }

    if (!res.ok) {
      throw new Error(`Failed to toggle human takeover: ${res.statusText}`);
    }

    const data: ToggleHumanTakeoverResponse = await res.json();
    if (data.success) {
      return data;
    }
    throw new Error(data.message || 'Failed to toggle human takeover');
  } catch (error) {
    console.error('Error toggling human takeover:', error);
    throw error;
  }
}
