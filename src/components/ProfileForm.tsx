"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Api } from "@/lib/api";

const schema = z.object({
  job: z.string().min(2, "Indiquez votre métier"),
  sector: z.string().min(2, "Indiquez votre secteur"),
  ai_level: z.string().min(1, "Niveau requis"),
  tools_used: z.string().optional(),
  work_style: z.string().optional(),
});

export function ProfileForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    const existingUserId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
    const payload = {
      user_id: existingUserId ?? undefined,
      job: values.job,
      sector: values.sector,
      ai_level: values.ai_level,
      tools_used: values.tools_used
        ? values.tools_used.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      work_style: values.work_style ?? undefined,
    };
    try {
      const res = await Api.postProfile(payload);
      // Persistance côté client
      localStorage.setItem("user_id", res.user_id);
      // Cookie pour le middleware
      document.cookie = `user_id=${res.user_id}; Path=/; Max-Age=31536000; SameSite=Lax`;

      toast.success("Profil enregistré. Génération du parcours en cours...");

      try {
        const pipeline = await Api.runPipeline(res.user_id);
        if (pipeline?.course_id) {
          localStorage.setItem("course_id", pipeline.course_id);
          toast.success("Modules personnalisés créés !");
          router.push(`/course/${pipeline.course_id}`);
          return;
        }
      } catch (err: any) {
        // En cas d’échec du pipeline, on redirige vers le dashboard
        toast.error(err?.message ?? "Le pipeline a échoué, vous pouvez réessayer depuis le tableau de bord.");
        router.push("/dashboard");
        return;
      }

      // Si la réponse pipeline n’a pas de course_id, fallback dashboard
      router.push("/dashboard");
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur lors de l’enregistrement");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="job">Métier</Label>
          <Input id="job" placeholder="QA Analyst, Développeur..." {...register("job")} />
          {errors.job && (
            <p className="text-xs text-red-600 mt-1">{errors.job.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="sector">Secteur</Label>
          <Input id="sector" placeholder="Santé, Fintech, Éducation..." {...register("sector")} />
          {errors.sector && (
            <p className="text-xs text-red-600 mt-1">{errors.sector.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ai_level">Niveau IA</Label>
          <Input id="ai_level" placeholder="Débutant, Intermédiaire, Avancé" {...register("ai_level")} />
          {errors.ai_level && (
            <p className="text-xs text-red-600 mt-1">{errors.ai_level.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="tools_used">Outils IA utilisés (séparés par des virgules)</Label>
          <Input id="tools_used" placeholder="Ollama, Rasa, LangChain..." {...register("tools_used")} />
        </div>
      </div>

      <div>
        <Label htmlFor="work_style">Style de travail / Contraintes</Label>
        <Textarea id="work_style" placeholder="Télétravail, horaires, préférences d’apprentissage..." {...register("work_style")} />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enregistrement..." : "Enregistrer et continuer"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>Passer</Button>
      </div>
    </form>
  );
}