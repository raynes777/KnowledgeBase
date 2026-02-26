package content;

import java.util.List;
import java.util.Optional;

import content.visitor.ContentVisitor;
import node.Node;

public class TranscludedContent extends Content<Node> {
	
	private  TranscludedContent(Node n) {
		super.setContent(n);
		super.setAuthor(n.content().author());
		super.setLinks(List.of());
		super.setVersion(Optional.empty());
	}
	
	public <T> void link(Content<T> c) {
		Link<TranscludedContent, Content<T>> newLink = Link.getNewLink(this, c);
		this.addLink(newLink);
		c.addLink(newLink);
	}
	
	@Override
	public <W> W accept(ContentVisitor<W> contentVisitor) {
		return contentVisitor.visitTranscludedContent(this);
	}
	
	public static Content<Node> from(Node n) {
		return new TranscludedContent(n);
	}
	

	


}
