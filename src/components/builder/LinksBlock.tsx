import React, { useState } from 'react';
import { LinksBlockData } from '@/types/builder';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface LinksBlockProps {
  id: string;
  data: LinksBlockData;
  onChange: (id: string, data: LinksBlockData) => void;
}

const LinksBlock: React.FC<LinksBlockProps> = ({ id, data, onChange }) => {
  const [links, setLinks] = useState(data.links || [{ title: '', url: '' }]);

  const handleLinkChange = (index: number, field: 'title' | 'url', value: string) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
    onChange(id, { ...data, links: newLinks });
  };

  const handleAddLink = () => {
    setLinks([...links, { title: '', url: '' }]);
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    setLinks(newLinks);
  };

  return (
    <div className="space-y-4">
      <Label>Links</Label>
      {links.map((link, index) => (
        <div key={index} className="flex items-center space-x-2">
          <div className="grid gap-2 flex-grow">
            <Input
              type="text"
              value={link.title}
              onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
              placeholder="Link Title"
            />
            <Input
              type="url"
              value={link.url}
              onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
              placeholder="Link URL"
            />
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveLink(index)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={handleAddLink}>
        <Plus className="h-4 w-4 mr-2" /> Add Link
      </Button>
    </div>
  );
};

export default LinksBlock;