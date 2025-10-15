"use client";

import { ProfileForm } from "@/components/ProfileForm";

export default function ProfilePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Mon profil</h1>
      <p className="text-sm text-neutral-600 mb-6">
        Complétez votre profil pour permettre à l’orchestrateur AI d’adapter les modules et quiz.
      </p>
      <ProfileForm />
    </div>
  );
}