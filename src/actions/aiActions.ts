import api from "@/lib/api";

export type GenerateDescriptionInput = {
  name: string;
  category?: string;
  brand?: string;
  gender?: string[];
  tags?: string[];
};

export type SuggestAttributesInput = {
  name: string;
  category?: string;
  brand?: string;
  description?: string;
};

export type SuggestAttributesOutput = {
  gender: string[];
  occasion: string[];
  style: string[];
  season: string[];
  fit: string;
  material: string;
};

export const generateProductDescription = async (
  input: GenerateDescriptionInput,
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify(input));
    const response = await api.post(
      "/api/v1/erp/ai/generate-description",
      formData,
    );
    return response.data.data.description as string;
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    throw new Error(
      err.response?.data?.message ??
        err.message ??
        "Description generation failed",
    );
  }
};

export const suggestProductAttributes = async (
  input: SuggestAttributesInput,
): Promise<SuggestAttributesOutput> => {
  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify(input));
    const response = await api.post(
      "/api/v1/erp/ai/suggest-attributes",
      formData,
    );
    return response.data.data as SuggestAttributesOutput;
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    throw new Error(
      err.response?.data?.message ??
        err.message ??
        "Attribute auto select failed",
    );
  }
};
