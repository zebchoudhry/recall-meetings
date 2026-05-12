import { Languages } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";

interface LanguageSelectorProps {
  spokenLang: string;
  displayLang: string;
  showOriginal: boolean;
  onSpokenLangChange: (code: string) => void;
  onDisplayLangChange: (code: string) => void;
  onShowOriginalChange: (value: boolean) => void;
}

export const LanguageSelector = ({
  spokenLang,
  displayLang,
  showOriginal,
  onSpokenLangChange,
  onDisplayLangChange,
  onShowOriginalChange,
}: LanguageSelectorProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/40 border rounded-lg">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Languages className="w-4 h-4 text-primary" />
        <span>Languages</span>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="spoken-lang" className="text-xs text-muted-foreground">
          I speak
        </Label>
        <Select value={spokenLang} onValueChange={onSpokenLangChange}>
          <SelectTrigger id="spoken-lang" className="h-9 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <span className="mr-2">{lang.flag}</span>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="display-lang" className="text-xs text-muted-foreground">
          Show in
        </Label>
        <Select value={displayLang} onValueChange={onDisplayLangChange}>
          <SelectTrigger id="display-lang" className="h-9 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <span className="mr-2">{lang.flag}</span>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Switch
          id="show-original"
          checked={showOriginal}
          onCheckedChange={onShowOriginalChange}
        />
        <Label htmlFor="show-original" className="text-xs text-muted-foreground cursor-pointer">
          Show original
        </Label>
      </div>
    </div>
  );
};